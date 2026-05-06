import * as functions from 'firebase-functions';
import {
  createSignSessionHandler,
  completeSignSessionHandler,
  signDocumentHandler,
} from '../src/signatures';

/* ------------------------------------------------------------------ */
//  Self-contained jest.mock factories
/* ------------------------------------------------------------------ */

jest.mock('node-fetch', () => jest.fn());
const mockedFetch = require('node-fetch') as jest.Mock;

jest.mock('firebase-admin', () => {
  const s = ((globalThis as any).__signaturesState__ = (globalThis as any).__signaturesState__ || {});
  if (!s.docGet) {
    s.docGet = jest.fn(() => Promise.resolve({data: () => ({}), exists: true}));
    s.docSet = jest.fn(() => Promise.resolve());
    s.docUpdate = jest.fn(() => Promise.resolve());
    s.batchSet = jest.fn();
    s.batchUpdate = jest.fn();
    s.batchCommit = jest.fn(() => Promise.resolve());
  }
  function makeDocRef(id = 'fake-ref') {
    return {
      id,
      get: jest.fn(() => s.docGet()),
      set: jest.fn((d: any) => s.docSet(d)),
      update: jest.fn((d: any) => s.docUpdate(d)),
      collection: jest.fn(() => ({doc: jest.fn((subId?: string) => makeDocRef(subId || 'sub-doc-id'))})),
    };
  }
  const db = {
    collection: jest.fn(() => ({doc: jest.fn((docId?: string) => makeDocRef(docId || 'root-doc-id'))})),
    collectionGroup: jest.fn(() => ({
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(() => s.docGet()),
        })),
      })),
    })),
    batch: jest.fn(() => ({
      set: jest.fn((...args: any[]) => s.batchSet(...args)),
      update: jest.fn((...args: any[]) => s.batchUpdate(...args)),
      commit: jest.fn(() => s.batchCommit()),
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => '__server_timestamp__'),
      increment: jest.fn((n: number) => `__incr_${n}__`),
    },
    FieldPath: {
      documentId: () => '__doc_id__',
    },
  };
  const dbFactory = jest.fn(() => db);
  dbFactory.FieldValue = db.FieldValue;
  dbFactory.FieldPath = db.FieldPath;
  return {
    initializeApp: jest.fn(),
    firestore: dbFactory,
  };
});

jest.mock('firebase-functions', () => ({
  config: jest.fn(() => ({})),
  https: {
    HttpsError: class HttpsError extends Error {
      code: string;
      constructor(code: string, message: string) {
        super(message);
        this.code = code;
      }
    },
  },
}));

import * as admin from 'firebase-admin';

/* ------------------------------------------------------------------ */
//  Helpers
/* ------------------------------------------------------------------ */
function getState(): any {
  return (globalThis as any).__signaturesState__;
}

function makeMockDoc(data: any, exists = true) {
  return {
    exists,
    data: () => data,
    ref: {id: 'fake-ref'},
  };
}

function makeContext(overrides?: Partial<functions.https.CallableContext>): functions.https.CallableContext {
  return {
    auth: {uid: 'lawyer-123', token: {name: 'Test Lawyer', edrpou: '12345678'}} as any,
    app: {appId: 'test-app'} as any,
    ...overrides,
  } as functions.https.CallableContext;
}

function makeUnauthenticatedContext(): functions.https.CallableContext {
  return makeContext({auth: undefined});
}

function makeBaseData(overrides?: any): any {
  return {
    clientId: 'client-1',
    caseId: 'case-1',
    documentId: 'doc-1',
    documentName: 'Договір',
    documentHash: 'abc123hash',
    accessToken: 'kep-token-123',
    ...overrides,
  };
}

function resetState() {
  const s = getState();
  s.docGet.mockReset();
  s.docSet.mockReset();
  s.docUpdate.mockReset();
  s.batchSet.mockReset();
  s.batchUpdate.mockReset();
  s.batchCommit.mockReset();
}

/* ================================================================== */
beforeEach(() => {
  jest.clearAllMocks();
  resetState();
  mockedFetch.mockReset();
  mockedFetch.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve(''),
      json: () => Promise.resolve({status: 'signed', signatureHash: 'abc123hash'}),
    }),
  );
});

/* ================================================================== */
describe('createSignSessionHandler', () => {
  it('throws unauthenticated when no auth context', async () => {
    await expect(
      createSignSessionHandler(makeBaseData(), makeUnauthenticatedContext()),
    ).rejects.toHaveProperty('code', 'unauthenticated');
  });

  it('creates a sign session and returns sessionId + signUrl', async () => {
    const result = await createSignSessionHandler(makeBaseData(), makeContext());
    expect(result).toHaveProperty('sessionId');
    expect(result).toHaveProperty('signUrl');
    expect(result.signUrl).toContain(encodeURIComponent('abc123hash'));
    expect(getState().docSet).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client-1',
        caseId: 'case-1',
        documentId: 'doc-1',
        documentName: 'Договір',
        documentHash: 'abc123hash',
        status: 'pending',
        createdBy: 'lawyer-123',
      }),
    );
  });
});

/* ================================================================== */
describe('completeSignSessionHandler', () => {
  it('throws unauthenticated when no auth context', async () => {
    await expect(
      completeSignSessionHandler({sessionId: 'sess-1'}, makeUnauthenticatedContext()),
    ).rejects.toHaveProperty('code', 'unauthenticated');
  });

  it('throws not-found when session does not exist', async () => {
    getState().docGet.mockResolvedValueOnce({ empty: true, docs: [] });
    await expect(
      completeSignSessionHandler({sessionId: 'sess-1'}, makeContext()),
    ).rejects.toHaveProperty('code', 'not-found');
  });

  it('completes a session and writes a signature record', async () => {
    getState().docGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          ref: {id: 'sess-ref'},
          data: () => ({
            clientId: 'client-1',
            caseId: 'case-1',
            documentId: 'doc-1',
            documentHash: 'abc123hash',
          }),
        },
      ],
    });

    const result = await completeSignSessionHandler({sessionId: 'sess-1'}, makeContext());
    expect(result).toHaveProperty('status', 'signed');
    expect(result).toHaveProperty('sessionId', 'sess-1');
    expect(getState().batchUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({status: 'signed'}),
    );
    expect(getState().batchSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'signed',
        signatureType: 'QES',
        signerIdentifier: '12345678',
      }),
    );
    expect(getState().batchCommit).toHaveBeenCalled();
  });
});

/* ================================================================== */
describe('signDocumentHandler', () => {
  it('throws unauthenticated when no auth context', async () => {
    await expect(
      signDocumentHandler(makeBaseData(), makeUnauthenticatedContext()),
    ).rejects.toHaveProperty('code', 'unauthenticated');
  });

  it('throws not-found when case does not exist', async () => {
    getState().docGet.mockResolvedValueOnce(makeMockDoc({}, false));
    await expect(
      signDocumentHandler(makeBaseData(), makeContext()),
    ).rejects.toHaveProperty('code', 'not-found');
  });

  it('throws permission-denied when user is not assigned lawyer nor owner', async () => {
    getState().docGet.mockResolvedValueOnce(
      makeMockDoc({assignedLawyers: ['other-lawyer'], lawyerId: 'someone-else'}),
    );
    await expect(
      signDocumentHandler(makeBaseData(), makeContext()),
    ).rejects.toHaveProperty('code', 'permission-denied');
  });

  it('allows signing when user is in assignedLawyers', async () => {
    getState().docGet.mockResolvedValueOnce(
      makeMockDoc({assignedLawyers: ['lawyer-123'], lawyerId: 'other-lawyer'}),
    );

    const result = await signDocumentHandler(makeBaseData(), makeContext());
    expect(result).toHaveProperty('status', 'signed');
    expect(result.signerName).toBe('Test Lawyer');
    expect(getState().batchCommit).toHaveBeenCalled();
  });

  it('allows signing when user is the case owner', async () => {
    getState().docGet.mockResolvedValueOnce(
      makeMockDoc({assignedLawyers: [], lawyerId: 'lawyer-123'}),
    );

    const result = await signDocumentHandler(makeBaseData(), makeContext());
    expect(result).toHaveProperty('status', 'signed');
    expect(getState().batchCommit).toHaveBeenCalled();
  });

  it('allows signing when user is in owner fallback field', async () => {
    getState().docGet.mockResolvedValueOnce(
      makeMockDoc({assignedLawyers: [], owner: 'lawyer-123'}),
    );

    const result = await signDocumentHandler(makeBaseData(), makeContext());
    expect(result).toHaveProperty('status', 'signed');
    expect(getState().batchCommit).toHaveBeenCalled();
  });

  it('writes correct signature payload and updates document signCount', async () => {
    getState().docGet.mockResolvedValueOnce(
      makeMockDoc({assignedLawyers: ['lawyer-123']}),
    );

    const result = await signDocumentHandler(makeBaseData(), makeContext());
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('documentId', 'doc-1');
    expect(result).toHaveProperty('documentName', 'Договір');
    expect(result).toHaveProperty('signatureHash', 'abc123hash');
    expect(result).toHaveProperty('signatureType', 'QES');
    expect(result).toHaveProperty('verificationUrl', 'https://id.gov.ua/verify');
    expect(result.signerName).toBe('Test Lawyer');
    expect(result.signerIdentifier).toBe('12345678');
    expect(result.signedByUid).toBe('lawyer-123');

    expect(getState().batchSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        documentId: 'doc-1',
        documentName: 'Договір',
        status: 'signed',
        signatureHash: 'abc123hash',
        signatureType: 'QES',
        signedByUid: 'lawyer-123',
      }),
    );

    expect(getState().batchUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        lastSignedAt: '__server_timestamp__',
        signCount: '__incr_1__',
      }),
    );

    expect(getState().batchCommit).toHaveBeenCalledTimes(1);
  });

  it('accepts optional overrides for signerName, signerIdentifier and signatureType', async () => {
    getState().docGet.mockResolvedValueOnce(
      makeMockDoc({assignedLawyers: ['lawyer-123']}),
    );

    const data = {
      ...makeBaseData(),
      signerName: 'Custom Name',
      signerIdentifier: '99999999',
      signatureType: 'SES',
    };

    const result = await signDocumentHandler(data, makeContext());
    expect(result.signerName).toBe('Custom Name');
    expect(result.signerIdentifier).toBe('99999999');
    expect(result.signatureType).toBe('SES');
  });

  it('falls back to uid when edrpou is absent in auth token', async () => {
    getState().docGet.mockResolvedValueOnce(
      makeMockDoc({assignedLawyers: ['lawyer-123']}),
    );

    const ctx = makeContext({auth: {uid: 'lawyer-123', token: {name: 'NoEdrpou'}} as any});
    const result = await signDocumentHandler(makeBaseData(), ctx);
    expect(result.signerIdentifier).toBe('lawyer-123');
  });

  it('falls back to default signerName when auth token name is absent', async () => {
    getState().docGet.mockResolvedValueOnce(
      makeMockDoc({assignedLawyers: ['lawyer-123']}),
    );

    const ctx = makeContext({auth: {uid: 'lawyer-123', token: {}} as any});
    const result = await signDocumentHandler(makeBaseData(), ctx);
    expect(result.signerName).toBe('Юрист (КЕП)');
  });
});
