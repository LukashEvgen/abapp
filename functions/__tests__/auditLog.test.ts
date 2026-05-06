import * as functions from 'firebase-functions';
import {writeAuditLogHandler, WriteAuditLogData} from '../src/auditLog';

/* ------------------------------------------------------------------ */
//  Self-contained jest.mock factory for firebase-admin
/* ------------------------------------------------------------------ */

jest.mock('firebase-admin', () => {
  const s = (
    (globalThis as any).__auditLogState__ = (globalThis as any).__auditLogState__ || {}
  );
  if (!s.docSet) {
    s.docSet = jest.fn(() => Promise.resolve());
  }
  function makeDoc() {
    return {
      id: 'log-id-generated',
      set: jest.fn((d: any) => s.docSet(d)),
    };
  }
  function makeCol() {
    return {doc: jest.fn(() => makeDoc())};
  }
  function makeDb() {
    return {collection: jest.fn(() => makeCol())};
  }
  const dbFactory = jest.fn(() => makeDb());
  dbFactory.FieldValue = {
    serverTimestamp: jest.fn(() => '__ts__'),
  };
  return {
    initializeApp: jest.fn(),
    firestore: dbFactory,
  };
});

function getState(): any {
  return (globalThis as any).__auditLogState__;
}

beforeEach(() => {
  jest.clearAllMocks();
  getState().docSet.mockReset();
  getState().docSet.mockResolvedValue(undefined);
});

function makeContext(
  overrides: Partial<functions.https.CallableContext> = {},
): functions.https.CallableContext {
  return {
    app: {appId: 'test-app'},
    auth: {uid: 'user-123', token: {}},
    rawRequest: {ip: '127.0.0.1'},
    ...overrides,
  } as any;
}

function makeData(overrides: Partial<WriteAuditLogData> = {}): WriteAuditLogData {
  return {
    actorType: 'lawyer',
    action: 'document_updated',
    targetCollection: 'cases',
    targetDocId: 'case-1',
    clientId: 'client-1',
    caseId: 'case-1',
    details: {field: 'status', oldValue: 'pending', newValue: 'in_progress'},
    ...overrides,
  };
}

/* ================================================================== */

describe('writeAuditLogHandler', () => {
  it('writes audit log with all fields and returns logId', async () => {
    const data = makeData();
    const ctx = makeContext();

    const result = await writeAuditLogHandler(data, ctx);

    expect(result).toEqual({logId: 'log-id-generated'});
    expect(getState().docSet).toHaveBeenCalledWith({
      actorId: 'user-123',
      actorType: 'lawyer',
      action: 'document_updated',
      targetCollection: 'cases',
      targetDocId: 'case-1',
      createdAt: '__ts__',
      ip: '127.0.0.1',
      clientId: 'client-1',
      caseId: 'case-1',
      details: {field: 'status', oldValue: 'pending', newValue: 'in_progress'},
    });
  });

  it('writes audit log without optional fields when omitted', async () => {
    const data = makeData({
      clientId: undefined,
      caseId: undefined,
      details: undefined,
    });
    const ctx = makeContext();

    await writeAuditLogHandler(data, ctx);

    const payload = getState().docSet.mock.calls[0][0];
    expect(payload).not.toHaveProperty('clientId');
    expect(payload).not.toHaveProperty('caseId');
    expect(payload).not.toHaveProperty('details');
  });

  it('throws failed-precondition when context.app is missing', async () => {
    const data = makeData();
    const ctx = makeContext({app: null});

    await expect(writeAuditLogHandler(data, ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'failed-precondition',
        'App Check token is missing or invalid. Request rejected.',
      ),
    );
  });

  it('throws unauthenticated when context.auth is missing', async () => {
    const data = makeData();
    const ctx = makeContext({auth: null});

    await expect(writeAuditLogHandler(data, ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated.',
      ),
    );
  });

  it('throws invalid-argument for missing actorType', async () => {
    const data = makeData({actorType: undefined as any});
    const ctx = makeContext();

    await expect(writeAuditLogHandler(data, ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'invalid-argument',
        'Missing required field: actorType',
      ),
    );
  });

  it('throws invalid-argument for missing action', async () => {
    const data = makeData({action: undefined as any});
    const ctx = makeContext();

    await expect(writeAuditLogHandler(data, ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'invalid-argument',
        'Missing required field: action',
      ),
    );
  });

  it('throws invalid-argument for missing targetCollection', async () => {
    const data = makeData({targetCollection: undefined as any});
    const ctx = makeContext();

    await expect(writeAuditLogHandler(data, ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'invalid-argument',
        'Missing required field: targetCollection',
      ),
    );
  });

  it('throws invalid-argument for missing targetDocId', async () => {
    const data = makeData({targetDocId: undefined as any});
    const ctx = makeContext();

    await expect(writeAuditLogHandler(data, ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'invalid-argument',
        'Missing required field: targetDocId',
      ),
    );
  });

  it('throws invalid-argument for invalid actorType', async () => {
    const data = makeData({actorType: 'admin' as any});
    const ctx = makeContext();

    await expect(writeAuditLogHandler(data, ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'invalid-argument',
        'Invalid actorType. Must be one of: lawyer, client, system',
      ),
    );
  });

  it('accepts each valid actorType', async () => {
    const validTypes: WriteAuditLogData['actorType'][] = ['lawyer', 'client', 'system'];
    for (const actorType of validTypes) {
      const data = makeData({actorType});
      const ctx = makeContext();
      getState().docSet.mockResolvedValue(undefined);
      const result = await writeAuditLogHandler(data, ctx);
      expect(result.logId).toBe('log-id-generated');
    }
    expect(getState().docSet).toHaveBeenCalledTimes(3);
  });

  it('sets ip to null when rawRequest.ip is absent', async () => {
    const data = makeData();
    const ctx = makeContext({rawRequest: {}} as any);

    await writeAuditLogHandler(data, ctx);

    const payload = getState().docSet.mock.calls[0][0];
    expect(payload.ip).toBeNull();
  });
});
