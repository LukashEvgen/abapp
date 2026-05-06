import * as functions from 'firebase-functions';

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({exists: true, data: () => ({})})),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
      })),
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      commit: jest.fn(() => Promise.resolve()),
    })),
    FieldValue: {
      serverTimestamp: jest.fn(),
      increment: jest.fn((n: number) => `__incr_${n}__`),
    },
    FieldPath: {
      documentId: () => '__doc_id__',
    },
  })),
  messaging: jest.fn(() => ({send: jest.fn()})),
  storage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        download: jest.fn(() => Promise.resolve([Buffer.from('test')])),
        setMetadata: jest.fn(() => Promise.resolve()),
      })),
    })),
  })),
}));

jest.mock('node-fetch', () => jest.fn());
const mockedFetch = require('node-fetch') as jest.Mock;

import {
  searchEdrHandler,
  searchCourtHandler,
  searchEnforcementHandler,
} from '../src/registry/edr';
import {searchCourtHandler as courtHandler} from '../src/registry/court';
import {searchEnforcementHandler as enforcementHandler} from '../src/registry/enforcement';
import {
  createSignSessionHandler,
  completeSignSessionHandler,
  signDocumentHandler,
} from '../src/signatures';
import {
  initiateKEPAuthHandler,
  exchangeKEPCodeHandler,
  getKEPTokenHandler,
} from '../src/kepAuth';
import {scanDocumentHandler} from '../src/documents';
import {writeAuditLogHandler} from '../src/auditLog';

/* ------------------------------------------------------------------ */
//  Helpers
/* ------------------------------------------------------------------ */
function makeContext(overrides?: Partial<functions.https.CallableContext>): functions.https.CallableContext {
  return {
    auth: {uid: 'lawyer-123', token: {name: 'Test Lawyer'}} as any,
    app: {appId: 'test-app'} as any,
    ...overrides,
  } as functions.https.CallableContext;
}

function makeNoAppCheckContext(): functions.https.CallableContext {
  return {
    auth: {uid: 'lawyer-123', token: {name: 'Test Lawyer'}} as any,
    app: undefined,
  } as any as functions.https.CallableContext;
}

function assertFailedPrecondition(promise: Promise<any>) {
  return expect(promise).rejects.toHaveProperty('code', 'failed-precondition');
}

/* ------------------------------------------------------------------ */
//  Registry handlers
/* ------------------------------------------------------------------ */

describe('App Check enforcement — registry handlers', () => {
  it('searchEdrHandler rejects without App Check', async () => {
    await assertFailedPrecondition(
      searchEdrHandler({query: 'test'}, makeNoAppCheckContext()),
    );
  });

  it('searchCourtHandler rejects without App Check', async () => {
    await assertFailedPrecondition(
      courtHandler({query: 'test'}, makeNoAppCheckContext()),
    );
  });

  it('searchEnforcementHandler rejects without App Check', async () => {
    await assertFailedPrecondition(
      enforcementHandler({query: 'test'}, makeNoAppCheckContext()),
    );
  });
});

/* ------------------------------------------------------------------ */
//  Signature handlers
/* ------------------------------------------------------------------ */

describe('App Check enforcement — signature handlers', () => {
  it('createSignSessionHandler rejects without App Check', async () => {
    await assertFailedPrecondition(
      createSignSessionHandler(
        {clientId: 'c1', caseId: 'case1', documentId: 'd1', documentName: 'Doc', documentHash: 'hash'},
        makeNoAppCheckContext(),
      ),
    );
  });

  it('completeSignSessionHandler rejects without App Check', async () => {
    await assertFailedPrecondition(
      completeSignSessionHandler({sessionId: 'sess-1'}, makeNoAppCheckContext()),
    );
  });

  it('signDocumentHandler rejects without App Check', async () => {
    await assertFailedPrecondition(
      signDocumentHandler(
        {clientId: 'c1', caseId: 'case1', documentId: 'd1', documentName: 'Doc'},
        makeNoAppCheckContext(),
      ),
    );
  });
});

/* ------------------------------------------------------------------ */
//  KEP handlers
/* ------------------------------------------------------------------ */

describe('App Check enforcement — KEP handlers', () => {
  it('initiateKEPAuthHandler rejects without App Check', async () => {
    await assertFailedPrecondition(
      initiateKEPAuthHandler({}, makeNoAppCheckContext()),
    );
  });

  it('exchangeKEPCodeHandler rejects without App Check', async () => {
    await assertFailedPrecondition(
      exchangeKEPCodeHandler({code: 'c', state: 's'}, makeNoAppCheckContext()),
    );
  });

  it('getKEPTokenHandler rejects without App Check', async () => {
    await assertFailedPrecondition(
      getKEPTokenHandler({}, makeNoAppCheckContext()),
    );
  });
});

/* ------------------------------------------------------------------ */
//  Document scan handler
/* ------------------------------------------------------------------ */

describe('App Check enforcement — scanDocumentHandler', () => {
  it('rejects without App Check', async () => {
    await assertFailedPrecondition(
      scanDocumentHandler(
        {clientId: 'c1', caseId: 'case1', documentId: 'd1', storagePath: 'path'},
        makeNoAppCheckContext(),
      ),
    );
  });
});

/* ------------------------------------------------------------------ */
//  Audit log handler
/* ------------------------------------------------------------------ */

describe('App Check enforcement — writeAuditLogHandler', () => {
  it('rejects without App Check', async () => {
    await assertFailedPrecondition(
      writeAuditLogHandler(
        {
          actorType: 'lawyer',
          action: 'test',
          targetCollection: 'clients',
          targetDocId: 'c1',
        },
        makeNoAppCheckContext(),
      ),
    );
  });
});

/* ------------------------------------------------------------------ */
//  End
/* ------------------------------------------------------------------ */

