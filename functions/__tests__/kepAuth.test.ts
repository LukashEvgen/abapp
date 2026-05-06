import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import {
  initiateKEPAuthHandler,
  exchangeKEPCodeHandler,
  getKEPTokenHandler,
} from '../src/kepAuth';

jest.mock('node-fetch');
const mockedFetch = fetch as unknown as jest.Mock;

/* ------------------------------------------------------------------ */
//  Inline mocks for firebase-admin and firebase-functions
/* ------------------------------------------------------------------ */
const mockGet = jest.fn();
const mockSet = jest.fn(() => Promise.resolve());
const mockUpdate = jest.fn(() => Promise.resolve());
const batchSet = jest.fn();
const batchCommit = jest.fn(() => Promise.resolve());

function makeDocRef(): any {
  return {
    get: mockGet,
    set: mockSet,
    update: mockUpdate,
    collection: jest.fn(() => ({doc: jest.fn(() => makeDocRef())})),
  };
}

function makeFirestore() {
  return {
    collection: jest.fn(() => ({doc: jest.fn(() => makeDocRef())})),
    batch: jest.fn(() => ({
      set: batchSet,
      update: jest.fn(),
      commit: batchCommit,
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => '__server_timestamp__'),
    },
    Timestamp: {
      fromMillis: jest.fn((ms: number) => ({toMillis: () => ms, isEqual: () => false})),
    },
    FieldPath: {
      documentId: () => '__doc_id__',
    },
  };
}

jest.mock('firebase-admin', () => {
  const mockMakeDocRef = () => ({
    get: jest.fn(),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    collection: jest.fn(() => ({doc: jest.fn(() => mockMakeDocRef())})),
  });
  const mockFirestoreFn = jest.fn(() => ({
    collection: jest.fn(() => ({doc: jest.fn(() => mockMakeDocRef())})),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      commit: jest.fn(() => Promise.resolve()),
    })),
  }));
  mockFirestoreFn.FieldValue = {
    serverTimestamp: jest.fn(() => '__server_timestamp__'),
  };
  mockFirestoreFn.Timestamp = {
    fromMillis: jest.fn((ms: number) => ({toMillis: () => ms, isEqual: () => false})),
  };
  mockFirestoreFn.FieldPath = {
    documentId: () => '__doc_id__',
  };

  return {
    initializeApp: jest.fn(),
    firestore: mockFirestoreFn,
    messaging: jest.fn(() => ({send: jest.fn()})),
  };
});

import * as admin from 'firebase-admin';

jest.mock('firebase-functions', () => ({
  config: jest.fn(),
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

/* ------------------------------------------------------------------ */
//  Helpers
/* ------------------------------------------------------------------ */
function makeMockDoc(data: any, exists = true) {
  return {
    exists,
    data: () => data,
    ref: {id: 'fake-ref'},
  };
}

function makeContext(overrides?: Partial<functions.https.CallableContext>): functions.https.CallableContext {
  return {
    auth: {uid: 'lawyer-123', token: {name: 'Test Lawyer'}} as any,
    app: {appId: 'test-app'} as any,
    ...overrides,
  } as functions.https.CallableContext;
}

function makeUnauthenticatedContext(): functions.https.CallableContext {
  return makeContext({auth: undefined});
}

function setDefaultMocks() {
  (functions.config as jest.Mock).mockReturnValue({
    kep: {
      client_id: 'kep-client-id',
      client_secret: 'kep-secret',
      redirect_uri: 'https://example.com/callback',
    },
  });
  (admin.firestore as unknown as jest.Mock).mockReturnValue(makeFirestore());
}

/* ================================================================== */
beforeEach(() => {
  jest.clearAllMocks();
  mockedFetch.mockReset();
  mockGet.mockReset();
  mockSet.mockReset();
  mockUpdate.mockReset();
  batchSet.mockReset();
  batchCommit.mockReset();

  setDefaultMocks();
});

/* ================================================================== */
describe('initiateKEPAuthHandler', () => {
  it('throws unauthenticated when no auth context', async () => {
    await expect(initiateKEPAuthHandler({}, makeUnauthenticatedContext())).rejects.toHaveProperty(
      'code',
      'unauthenticated',
    );
  });

  it('throws failed-precondition when KEP config missing', async () => {
    (functions.config as jest.Mock).mockReturnValue({});
    await expect(initiateKEPAuthHandler({}, makeContext())).rejects.toHaveProperty(
      'code',
      'failed-precondition',
    );
  });

  it('returns authorize URL with PKCE params and stores verifier', async () => {
    const result = await initiateKEPAuthHandler({}, makeContext());
    expect(result).toHaveProperty('authorizeUrl');
    expect(result).toHaveProperty('state');

    const url = new URL(result.authorizeUrl);
    expect(url.pathname).toBe('/authorize');
    expect(url.searchParams.get('client_id')).toBe('kep-client-id');
    expect(url.searchParams.get('redirect_uri')).toBe('https://example.com/callback');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('sign');
    expect(url.searchParams.get('state')).toBe(result.state);
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        codeVerifier: expect.any(String),
        createdAt: '__server_timestamp__',
        exchanged: false,
      }),
    );
  });
});

/* ================================================================== */
describe('exchangeKEPCodeHandler', () => {
  it('throws unauthenticated when no auth context', async () => {
    await expect(
      exchangeKEPCodeHandler({code: 'c', state: 's'}, makeUnauthenticatedContext()),
    ).rejects.toHaveProperty('code', 'unauthenticated');
  });

  it('throws invalid-argument when code or state missing', async () => {
    await expect(
      exchangeKEPCodeHandler({code: '', state: ''}, makeContext()),
    ).rejects.toHaveProperty('code', 'invalid-argument');
  });

  it('throws failed-precondition when pending doc not found', async () => {
    mockGet.mockResolvedValue(makeMockDoc({}, false));
    await expect(
      exchangeKEPCodeHandler({code: 'abc', state: 'xyz'}, makeContext()),
    ).rejects.toHaveProperty('code', 'failed-precondition');
  });

  it('throws already-exists when code already exchanged', async () => {
    mockGet.mockResolvedValue(makeMockDoc({codeVerifier: 'v', exchanged: true}));
    await expect(
      exchangeKEPCodeHandler({code: 'abc', state: 'xyz'}, makeContext()),
    ).rejects.toHaveProperty('code', 'already-exists');
  });

  it('exchanges code, writes token doc, and marks exchanged', async () => {
    mockGet.mockResolvedValueOnce(makeMockDoc({codeVerifier: 'test-verifier', exchanged: false}));

    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: jest.fn(() => Promise.resolve('')),
        json: jest.fn(() =>
          Promise.resolve({
            access_token: 'acc-token-1',
            refresh_token: 'ref-token-1',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'sign',
          }),
        ),
      } as any),
    );

    const result = await exchangeKEPCodeHandler({code: 'c', state: 's'}, makeContext());
    expect(result.success).toBe(true);

    expect(mockedFetch).toHaveBeenCalledWith(
      expect.stringContaining('/token'),
      expect.objectContaining({method: 'POST'}),
    );
    const fetchBody = mockedFetch.mock.calls[0][1].body as string;
    const params = new URLSearchParams(fetchBody);
    expect(params.get('client_id')).toBe('kep-client-id');
    expect(params.get('client_secret')).toBe('kep-secret');
    expect(params.get('code')).toBe('c');
    expect(params.get('grant_type')).toBe('authorization_code');
    expect(params.get('code_verifier')).toBe('test-verifier');

    expect(batchSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        accessToken: 'acc-token-1',
        refreshToken: 'ref-token-1',
        tokenType: 'Bearer',
        scope: 'sign',
      }),
    );
    expect(batchCommit).toHaveBeenCalled();
  });

  it('throws when token endpoint returns error JSON', async () => {
    mockGet.mockResolvedValueOnce(makeMockDoc({codeVerifier: 'v', exchanged: false}));
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: jest.fn(() => Promise.resolve('')),
        json: jest.fn(() =>
          Promise.resolve({error: 'invalid_grant', error_description: 'Bad code'}),
        ),
      } as any),
    );
    await expect(
      exchangeKEPCodeHandler({code: 'bad', state: 's'}, makeContext()),
    ).rejects.toHaveProperty('code', 'unknown');
  });

  it('throws when token endpoint HTTP status is not ok', async () => {
    mockGet.mockResolvedValueOnce(makeMockDoc({codeVerifier: 'v', exchanged: false}));
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        text: jest.fn(() => Promise.resolve('Bad Request')),
      } as any),
    );
    await expect(
      exchangeKEPCodeHandler({code: 'bad', state: 's'}, makeContext()),
    ).rejects.toHaveProperty('code', 'unknown');
  });
});

/* ================================================================== */
describe('getKEPTokenHandler', () => {
  it('throws unauthenticated when no auth context', async () => {
    await expect(getKEPTokenHandler({}, makeUnauthenticatedContext())).rejects.toHaveProperty(
      'code',
      'unauthenticated',
    );
  });

  it('throws not-found when no token doc exists', async () => {
    mockGet.mockResolvedValue(makeMockDoc({}, false));
    await expect(getKEPTokenHandler({}, makeContext())).rejects.toHaveProperty('code', 'not-found');
  });

  it('returns token directly when not near expiry', async () => {
    const future = Date.now() + 3600 * 1000;
    mockGet.mockResolvedValue(
      makeMockDoc({
        accessToken: 'current-token',
        expiresAt: {toMillis: () => future},
      }),
    );
    const result = await getKEPTokenHandler({}, makeContext());
    expect(result.accessToken).toBe('current-token');
    expect(result.expiresAt).toBe(future);
    expect(mockedFetch).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('refreshes token when near expiry and updates doc', async () => {
    const past = Date.now() + 60 * 1000; // < 5 min window triggers refresh
    mockGet.mockResolvedValue(
      makeMockDoc({
        accessToken: 'old-token',
        expiresAt: {toMillis: () => past},
        refreshToken: 'refresh-me',
        tokenType: 'Bearer',
        scope: 'sign',
      }),
    );

    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: jest.fn(() => Promise.resolve('')),
        json: jest.fn(() =>
          Promise.resolve({
            access_token: 'new-token',
            refresh_token: 'new-refresh',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'sign',
          }),
        ),
      } as any),
    );

    const result = await getKEPTokenHandler({}, makeContext());
    expect(result.accessToken).toBe('new-token');
    expect(result.expiresAt).toBeGreaterThan(Date.now() + 3000 * 1000);

    expect(mockedFetch).toHaveBeenCalledWith(
      expect.stringContaining('/token'),
      expect.objectContaining({method: 'POST'}),
    );
    const body = mockedFetch.mock.calls[0][1].body as string;
    const params = new URLSearchParams(body);
    expect(params.get('grant_type')).toBe('refresh_token');
    expect(params.get('refresh_token')).toBe('refresh-me');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      }),
    );
  });

  it('throws failed-precondition when token expired but no refresh token', async () => {
    const past = Date.now() + 60 * 1000;
    mockGet.mockResolvedValue(
      makeMockDoc({
        accessToken: 'old-token',
        expiresAt: {toMillis: () => past},
        refreshToken: undefined,
      }),
    );
    await expect(getKEPTokenHandler({}, makeContext())).rejects.toHaveProperty(
      'code',
      'failed-precondition',
    );
  });

  it('throws when refresh endpoint returns non-ok HTTP', async () => {
    const past = Date.now() + 60 * 1000;
    mockGet.mockResolvedValue(
      makeMockDoc({
        accessToken: 'old-token',
        expiresAt: {toMillis: () => past},
        refreshToken: 'refresh-me',
      }),
    );
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        text: jest.fn(() => Promise.resolve('Unauthorized')),
      } as any),
    );
    await expect(getKEPTokenHandler({}, makeContext())).rejects.toHaveProperty('code', 'unknown');
  });
});
