import {onDocumentUploadHandler} from '../src/storageTriggers';
import * as functions from 'firebase-functions';

/* ------------------------------------------------------------------ */
//  firebase-admin mock — firestore + storage
/* ------------------------------------------------------------------ */
jest.mock('firebase-admin', () => {
  const s = ((globalThis as any).__storageTriggerState__ =
    (globalThis as any).__storageTriggerState__ || {});
  if (!s.whereG) {
    s.whereG = jest.fn(() => Promise.resolve({empty: true, docs: []}));
    s.docU = jest.fn(() => Promise.resolve());
    s.fileDownload = jest.fn(() => Promise.resolve([Buffer.from('test-pdf-data')]));
    s.fileSetMetadata = jest.fn(() => Promise.resolve());
  }

  function makeDoc() {
    return {
      update: jest.fn((d: any) => s.docU(d)),
      collection: jest.fn(() => makeCol()),
    };
  }
  function makeCol() {
    return {
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(() => s.whereG()),
        })),
      })),
      doc: jest.fn(() => makeDoc()),
    };
  }
  function makeDb() {
    return {collection: jest.fn(() => makeCol())};
  }
  const dbFactory = jest.fn(() => makeDb());
  dbFactory.FieldValue = {
    serverTimestamp: jest.fn(() => '__ts__'),
    delete: jest.fn(() => '__delete__'),
  };

  function makeFile() {
    return {
      download: jest.fn(() => s.fileDownload()),
      setMetadata: jest.fn((m: any) => s.fileSetMetadata(m)),
    };
  }
  function makeBucket() {
    return {
      file: jest.fn(() => makeFile()),
    };
  }

  return {
    initializeApp: jest.fn(),
    firestore: dbFactory,
    storage: jest.fn(() => ({
      bucket: jest.fn(() => makeBucket()),
    })),
  };
});

/* ------------------------------------------------------------------ */
//  virusScan mock
/* ------------------------------------------------------------------ */
jest.mock('../src/virusScan', () => {
  return {
    scanFile: jest.fn(() =>
      Promise.resolve({
        scanned: true,
        scanStatus: 'clean',
        sha256: 'abc123',
        malicious: 0,
      }),
    ),
    updateDocumentScanInFirestore: jest.fn(() => Promise.resolve()),
    updateFileMetadata: jest.fn(() => Promise.resolve()),
  };
});

import {
  scanFile,
  updateDocumentScanInFirestore,
  updateFileMetadata,
} from '../src/virusScan';

function getState(): any {
  return (globalThis as any).__storageTriggerState__;
}

function mockFirestoreDocs(
  docs: {id: string; data: Record<string, any>}[],
) {
  getState().whereG.mockResolvedValue({
    empty: docs.length === 0,
    docs: docs.map(d => ({
      id: d.id,
      data: () => d.data,
    })),
  });
}

function makeObject(params: {
  bucket: string;
  name: string;
  contentType?: string;
}): functions.storage.ObjectMetadata {
  return {
    bucket: params.bucket,
    name: params.name,
    contentType: params.contentType || 'application/pdf',
    metageneration: '1',
    timeCreated: new Date().toISOString(),
    updated: new Date().toISOString(),
    storageClass: 'STANDARD',
    size: '1024',
    md5Hash: 'd41d8cd98f00b204e9800998ecf8427e',
    mediaLink:
      'https://storage.googleapis.com/download/storage/v1/b/' +
      params.bucket +
      '/o/' +
      encodeURIComponent(params.name) +
      '?generation=1&alt=media',
  } as functions.storage.ObjectMetadata;
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.values(getState()).forEach((fn: any) => fn.mockReset?.());
  getState().whereG.mockResolvedValue({empty: true, docs: []});
  getState().fileDownload.mockResolvedValue([Buffer.from('test-pdf-data')]);
  getState().fileSetMetadata.mockResolvedValue(undefined);
  (scanFile as jest.Mock).mockResolvedValue({
    scanned: true,
    scanStatus: 'clean',
    sha256: 'abc123',
    malicious: 0,
  });
});

/* ================================================================== */

describe('onDocumentUploadHandler', () => {
  it('skips when filePath does not match document pattern', async () => {
    const obj = makeObject({
      bucket: 'my-bucket',
      name: 'templates/invoice.pdf',
    });

    await onDocumentUploadHandler(obj);

    expect(getState().whereG).not.toHaveBeenCalled();
    expect(scanFile).not.toHaveBeenCalled();
  });

  it('skips when no Firestore document matches storagePath', async () => {
    mockFirestoreDocs([]);
    const obj = makeObject({
      bucket: 'my-bucket',
      name: 'clients/c1/cases/case1/documents/test.pdf',
    });

    await onDocumentUploadHandler(obj);

    expect(getState().whereG).toHaveBeenCalledTimes(1);
    expect(scanFile).not.toHaveBeenCalled();
    expect(updateDocumentScanInFirestore).not.toHaveBeenCalled();
  });

  it('skips idempotently when already scanned clean', async () => {
    mockFirestoreDocs([
      {
        id: 'doc-1',
        data: {
          storagePath: 'clients/c1/cases/case1/documents/test.pdf',
          scanStatus: 'clean',
          sha256: 'abc123',
        },
      },
    ]);
    const obj = makeObject({
      bucket: 'my-bucket',
      name: 'clients/c1/cases/case1/documents/test.pdf',
    });

    await onDocumentUploadHandler(obj);

    expect(scanFile).not.toHaveBeenCalled();
    expect(updateDocumentScanInFirestore).not.toHaveBeenCalled();
  });

  it('scans and updates when document is pending', async () => {
    mockFirestoreDocs([
      {
        id: 'doc-1',
        data: {
          storagePath: 'clients/c1/cases/case1/documents/test.pdf',
          scanStatus: 'pending',
          sha256: 'abc123',
          mimeType: 'application/pdf',
        },
      },
    ]);
    const obj = makeObject({
      bucket: 'my-bucket',
      name: 'clients/c1/cases/case1/documents/test.pdf',
    });

    await onDocumentUploadHandler(obj);

    expect(scanFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      'abc123',
    );
    expect(updateDocumentScanInFirestore).toHaveBeenCalledWith(
      'c1',
      'case1',
      'doc-1',
      expect.objectContaining({scanStatus: 'clean', scanned: true}),
      'application/pdf',
    );
    expect(updateFileMetadata).toHaveBeenCalledWith(
      'clients/c1/cases/case1/documents/test.pdf',
      expect.objectContaining({scanStatus: 'clean'}),
    );
  });

  it('scans and updates when document is infected', async () => {
    (scanFile as jest.Mock).mockResolvedValue({
      scanned: true,
      scanStatus: 'infected',
      sha256: 'badhash',
      malicious: 5,
    });
    mockFirestoreDocs([
      {
        id: 'doc-2',
        data: {
          storagePath: 'clients/c1/cases/case1/documents/virus.exe',
          scanStatus: 'pending',
        },
      },
    ]);
    const obj = makeObject({
      bucket: 'my-bucket',
      name: 'clients/c1/cases/case1/documents/virus.exe',
    });

    await onDocumentUploadHandler(obj);

    expect(updateDocumentScanInFirestore).toHaveBeenCalledWith(
      'c1',
      'case1',
      'doc-2',
      expect.objectContaining({scanStatus: 'infected', scanned: true}),
      undefined,
    );
  });

  it('downloads file and uses sha256 from metadata when present', async () => {
    mockFirestoreDocs([
      {
        id: 'doc-3',
        data: {
          storagePath: 'clients/c1/cases/case1/documents/report.pdf',
          scanStatus: 'pending',
          sha256: 'existing-sha',
        },
      },
    ]);
    const obj = makeObject({
      bucket: 'my-bucket',
      name: 'clients/c1/cases/case1/documents/report.pdf',
    });

    await onDocumentUploadHandler(obj);

    expect(getState().fileDownload).toHaveBeenCalled();
    expect(scanFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      'existing-sha',
    );
  });
});
