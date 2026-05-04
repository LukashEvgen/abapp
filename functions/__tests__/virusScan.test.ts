import {
  hashFromBuffer,
  scanFile,
  updateDocumentScanInFirestore,
  updateFileMetadata,
} from '../src/virusScan';

/* ------------------------------------------------------------------ */
//  firebase-admin mock (firestore + storage)
/* ------------------------------------------------------------------ */
jest.mock('firebase-admin', function () {
  const state = {
    docUpdate: jest.fn(function () { return Promise.resolve(); }),
    fileSetMetadata: jest.fn(function () { return Promise.resolve(); }),
  };
  (globalThis).__virusScanState__ = state;

  function makeDoc() {
    return {
      update: state.docUpdate,
      collection: jest.fn(function () { return makeCol(); }),
    };
  }
  function makeCol() {
    return {
      doc: jest.fn(function () { return makeDoc(); }),
      collection: jest.fn(function () { return makeCol(); }),
    };
  }
  const dbFactory = jest.fn(function () {
    return {
      collection: jest.fn(function () { return makeCol(); }),
    };
  });
  dbFactory.FieldValue = {
    serverTimestamp: jest.fn(function () { return '__ts__'; }),
    delete: jest.fn(function () { return '__delete__'; }),
  };

  function makeFile() {
    return {
      setMetadata: state.fileSetMetadata,
    };
  }
  function makeBucket() {
    return {
      file: jest.fn(function () { return makeFile(); }),
    };
  }

  return {
    initializeApp: jest.fn(),
    firestore: dbFactory,
    storage: jest.fn(function () {
      return {
        bucket: jest.fn(function () { return makeBucket(); }),
      };
    }),
  };
});

function getState() {
  return (globalThis).__virusScanState__;
}

beforeEach(function () {
  jest.clearAllMocks();
  Object.values(getState()).forEach(function (fn) { fn.mockReset && fn.mockReset(); });
  getState().docUpdate.mockResolvedValue(undefined);
  getState().fileSetMetadata.mockResolvedValue(undefined);
  delete process.env.VIRUSTOTAL_API_KEY;
});

/* ================================================================== */

describe('hashFromBuffer', function () {
  it('returns correct sha256 for known input', async function () {
    const buf = Buffer.from('hello');
    const hash = await hashFromBuffer(buf);
    expect(hash).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });
});

describe('scanFile', function () {
  it('marks clean and computes hash when VIRUSTOTAL_API_KEY is missing', async function () {
    delete process.env.VIRUSTOTAL_API_KEY;
    const buf = Buffer.from('safe-content');
    const result = await scanFile(buf);

    expect(result.scanned).toBe(true);
    expect(result.scanStatus).toBe('clean');
    expect(result.malicious).toBe(0);
    expect(result.sha256).toHaveLength(64);
  });

  it('uses existing sha256 when provided and skips re-hash', async function () {
    delete process.env.VIRUSTOTAL_API_KEY;
    const buf = Buffer.from('safe-content');
    const result = await scanFile(buf, 'existing-sha256');

    expect(result.sha256).toBe('existing-sha256');
    expect(result.scanned).toBe(true);
    expect(result.scanStatus).toBe('clean');
  });

  it('calls VirusTotal and returns clean when malicious count is 0', async function () {
    process.env.VIRUSTOTAL_API_KEY = 'test-key';
    const sha = 'a'.repeat(64);

    global.fetch = jest.fn(function () {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: function () {
          return Promise.resolve({
            data: {
              attributes: {
                last_analysis_stats: { malicious: 0, harmless: 70 },
              },
            },
          });
        },
      });
    });

    const result = await scanFile(Buffer.from('x'), sha);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.virustotal.com/api/v3/files/' + sha,
      expect.objectContaining({ headers: { 'x-apikey': 'test-key' } }),
    );
    expect(result.scanned).toBe(true);
    expect(result.scanStatus).toBe('clean');
    expect(result.malicious).toBe(0);
  });

  it('returns infected when VirusTotal reports malicious > 0', async function () {
    process.env.VIRUSTOTAL_API_KEY = 'test-key';
    const sha = 'b'.repeat(64);

    global.fetch = jest.fn(function () {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: function () {
          return Promise.resolve({
            data: {
              attributes: {
                last_analysis_stats: { malicious: 3, harmless: 67 },
              },
            },
          });
        },
      });
    });

    const result = await scanFile(Buffer.from('x'), sha);
    expect(result.scanned).toBe(false);
    expect(result.scanStatus).toBe('infected');
    expect(result.malicious).toBe(3);
  });

  it('falls back to pending when VirusTotal returns 404', async function () {
    process.env.VIRUSTOTAL_API_KEY = 'test-key';
    const sha = 'c'.repeat(64);

    global.fetch = jest.fn(function () {
      return Promise.resolve({
        ok: false,
        status: 404,
        text: function () { return Promise.resolve('Not Found'); },
      });
    });

    const result = await scanFile(Buffer.from('x'), sha);
    expect(result.scanned).toBe(false);
    expect(result.scanStatus).toBe('pending');
    expect(result.malicious).toBe(0);
  });

  it('falls back to pending on network error', async function () {
    process.env.VIRUSTOTAL_API_KEY = 'test-key';
    const sha = 'd'.repeat(64);

    global.fetch = jest.fn(function () {
      return Promise.reject(new Error('network down'));
    });

    const result = await scanFile(Buffer.from('x'), sha);
    expect(result.scanned).toBe(false);
    expect(result.scanStatus).toBe('pending');
  });
});

describe('updateDocumentScanInFirestore', function () {
  it('updates document with scan result and serverTimestamp', async function () {
    const result = {
      scanned: true,
      scanStatus: 'clean',
      sha256: 'abc',
      malicious: 0,
    };

    await updateDocumentScanInFirestore('c1', 'case1', 'doc1', result, 'application/pdf');

    expect(getState().docUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        scanned: true,
        scanStatus: 'clean',
        sha256: 'abc',
        mimeType: 'application/pdf',
        scannedAt: '__ts__',
      }),
    );
  });

  it('deletes optional fields when omitted', async function () {
    const result = {
      scanned: false,
      scanStatus: 'pending',
      sha256: '',
      malicious: 0,
    };

    await updateDocumentScanInFirestore('c1', 'case1', 'doc2', result);

    expect(getState().docUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        scanned: false,
        scanStatus: 'pending',
        sha256: '__delete__',
        mimeType: '__delete__',
        scannedAt: '__ts__',
      }),
    );
  });
});

describe('updateFileMetadata', function () {
  it('sets scanned and scanStatus on storage file', async function () {
    const result = {
      scanned: true,
      scanStatus: 'infected',
      sha256: 'bad',
      malicious: 5,
    };

    await updateFileMetadata('clients/c1/cases/case1/documents/f.pdf', result);

    expect(getState().fileSetMetadata).toHaveBeenCalledWith({
      metadata: {
        scanned: 'true',
        scanStatus: 'infected',
      },
    });
  });
});

/* ================================================================== */
//  End-to-end smoke: scan + firestore update + storage metadata
/* ================================================================== */

describe('virus scan smoke flow', function () {
  it('upload -> scan -> update firestore + storage metadata (clean path)', async function () {
    delete process.env.VIRUSTOTAL_API_KEY;
    const buf = Buffer.from('legitimate-document');

    // 1. Scan
    const scanResult = await scanFile(buf);
    expect(scanResult.scanStatus).toBe('clean');
    expect(scanResult.sha256).toHaveLength(64);

    // 2. Update Firestore
    await updateDocumentScanInFirestore('clientA', 'caseX', 'doc123', scanResult, 'application/pdf');
    expect(getState().docUpdate).toHaveBeenCalledTimes(1);

    // 3. Update Storage metadata
    await updateFileMetadata('clients/clientA/cases/caseX/documents/doc123.pdf', scanResult);
    expect(getState().fileSetMetadata).toHaveBeenCalledTimes(1);
    expect(getState().fileSetMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ scanStatus: 'clean', scanned: 'true' }),
      }),
    );
  });
});
