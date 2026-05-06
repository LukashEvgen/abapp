import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

jest.mock('firebase-admin', () => {
  const s = (
    (globalThis as any).__inquiryState__ =
      (globalThis as any).__inquiryState__ || {}
  );
  if (!s.inquiryRef) {
    s.inquiryRef = {
      set: jest.fn(() => Promise.resolve()),
      id: 'inq-abc',
    };
    s.rateLimitRef = {
      get: jest.fn(() =>
        Promise.resolve({exists: false, data: () => ({})}),
      ),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
    };
    s.col = jest.fn((name: string) => {
      if (name === 'inquiries') {
        return {doc: jest.fn(() => s.inquiryRef)};
      }
      if (name === 'rate_limits_inquiries') {
        return {doc: jest.fn(() => s.rateLimitRef)};
      }
      return {
        doc: jest.fn(() => ({
          get: jest.fn(),
          set: jest.fn(),
          update: jest.fn(),
        })),
      };
    });
    s.db = {collection: s.col};
    s.firestore = jest.fn(() => s.db);
    s.firestore.FieldValue = {
      serverTimestamp: jest.fn(() => '__serverTimestamp__'),
      increment: jest.fn((n: number) => `__incr_${n}__`),
    };
  }
  return {
    initializeApp: jest.fn(),
    firestore: s.firestore,
  };
});

jest.mock('node-fetch', () => jest.fn());

jest.mock('firebase-functions', () => {
  const actual = jest.requireActual('firebase-functions');
  return {
    ...actual,
    config: jest.fn(() => {
      const s =
        (globalThis as any).__fnConfigState__ ||
        ((globalThis as any).__fnConfigState__ = {});
      return s.config || {};
    }),
  };
});

import {submitInquiryHandler} from '../src/inquiries';

const mockedFetch = fetch as unknown as jest.Mock;

function getState(): any {
  return (globalThis as any).__inquiryState__;
}

function makeContext(
  app?: {appId: string},
  ip?: string,
): functions.https.CallableContext {
  return {
    app,
    rawRequest: {ip, headers: {}},
  } as any;
}

function validData(): any {
  return {
    name: 'Іван Петренко',
    phone: '+380671234567',
    email: 'ivan@example.com',
    service: 'Консультація',
    message: 'Тестове звернення',
    turnstileToken: 'valid-turnstile-token',
  };
}

function mockRateLimitExists(count: number, windowStart: any) {
  getState().rateLimitRef.get.mockResolvedValue({
    exists: true,
    data: () => ({count, windowStart}),
  });
}

function mockRateLimitNotExists() {
  getState().rateLimitRef.get.mockResolvedValue({
    exists: false,
    data: () => ({}),
  });
}

function mockFetchTurnstile(ok: boolean, payload: any) {
  mockedFetch.mockResolvedValue({
    ok,
    json: () => Promise.resolve(payload),
  });
}

function setFnConfig(cfg: any) {
  const s =
    (globalThis as any).__fnConfigState__ ||
    ((globalThis as any).__fnConfigState__ = {});
  s.config = cfg;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedFetch.mockReset();

  // Stable mock for Turnstile secret so verification actually runs in most tests
  setFnConfig({turnstile: {secret: 'test-secret'}});

  const s = getState();
  // Reset only leaf mocks; do NOT reset structural functions (s.col, s.firestore)
  s.rateLimitRef.get.mockResolvedValue({exists: false, data: () => ({})});
  s.rateLimitRef.set.mockResolvedValue(undefined);
  s.rateLimitRef.update.mockResolvedValue(undefined);
  s.inquiryRef.set.mockResolvedValue(undefined);
  s.inquiryRef.id = 'inq-abc';
});

/* ================================================================== */

describe('submitInquiryHandler', () => {
  /* -- App Check --------------------------------------------------- */
  it('throws failed-precondition when App Check is missing', async () => {
    const ctx = makeContext(/* no app */);
    await expect(submitInquiryHandler(validData(), ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'failed-precondition',
        'App Check token is missing or invalid. Request rejected.',
      ),
    );
  });

  /* -- Validation -------------------------------------------------- */
  it('throws invalid-argument when turnstileToken is missing', async () => {
    const ctx = makeContext({appId: 'test-app'});
    const data = {...validData()};
    delete data.turnstileToken;
    await expect(submitInquiryHandler(data, ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'invalid-argument',
        'Turnstile token is required.',
      ),
    );
  });

  it('throws invalid-argument when turnstileToken is empty', async () => {
    const ctx = makeContext({appId: 'test-app'});
    const data = {...validData(), turnstileToken: ''};
    await expect(submitInquiryHandler(data, ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'invalid-argument',
        'Turnstile token is required.',
      ),
    );
  });

  it('throws invalid-argument when name is missing', async () => {
    const ctx = makeContext({appId: 'test-app'});
    const data = {...validData()};
    delete data.name;
    mockFetchTurnstile(true, {success: true});
    await expect(submitInquiryHandler(data, ctx)).rejects.toThrow(
      new functions.https.HttpsError('invalid-argument', 'Name is required.'),
    );
  });

  it('throws invalid-argument when phone is missing', async () => {
    const ctx = makeContext({appId: 'test-app'});
    const data = {...validData()};
    delete data.phone;
    mockFetchTurnstile(true, {success: true});
    await expect(submitInquiryHandler(data, ctx)).rejects.toThrow(
      new functions.https.HttpsError('invalid-argument', 'Phone is required.'),
    );
  });

  it('throws invalid-argument when message is missing', async () => {
    const ctx = makeContext({appId: 'test-app'});
    const data = {...validData()};
    delete data.message;
    mockFetchTurnstile(true, {success: true});
    await expect(submitInquiryHandler(data, ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'invalid-argument',
        'Message is required.',
      ),
    );
  });

  it('throws invalid-argument when email is not a string', async () => {
    const ctx = makeContext({appId: 'test-app'});
    const data = {...validData(), email: 123};
    mockFetchTurnstile(true, {success: true});
    await expect(submitInquiryHandler(data, ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'invalid-argument',
        'Email must be a string.',
      ),
    );
  });

  /* -- Turnstile --------------------------------------------------- */
  it('throws permission-denied when Turnstile verification fails', async () => {
    const ctx = makeContext({appId: 'test-app'});
    mockRateLimitNotExists();
    mockFetchTurnstile(true, {
      success: false,
      'error-codes': ['invalid-input-response'],
    });
    await expect(submitInquiryHandler(validData(), ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'permission-denied',
        'Turnstile verification failed.',
      ),
    );
  });

  it('throws internal when Turnstile network request fails', async () => {
    const ctx = makeContext({appId: 'test-app'});
    mockRateLimitNotExists();
    mockedFetch.mockResolvedValue({ok: false});
    await expect(submitInquiryHandler(validData(), ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'internal',
        'Turnstile verification network error.',
      ),
    );
  });

  it('skips Turnstile verification when secret is not configured', async () => {
    const ctx = makeContext({appId: 'test-app'});
    mockRateLimitNotExists();
    // Remove secret so verifyTurnstile skips
    setFnConfig({});
    const result = await submitInquiryHandler(validData(), ctx);
    expect(mockedFetch).not.toHaveBeenCalled();
    expect(result).toEqual({inquiryId: 'inq-abc'});
  });

  /* -- Rate Limit -------------------------------------------------- */
  it('creates rate limit bucket on first request', async () => {
    const ctx = makeContext({appId: 'test-app'});
    mockRateLimitNotExists();
    mockFetchTurnstile(true, {success: true});
    await submitInquiryHandler(validData(), ctx);
    expect(getState().rateLimitRef.set).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 1,
        windowStart: '__serverTimestamp__',
      }),
    );
  });

  it('increments rate limit within active window', async () => {
    const ctx = makeContext({appId: 'test-app'});
    const now = Date.now();
    mockRateLimitExists(2, {toMillis: () => now});
    mockFetchTurnstile(true, {success: true});
    await submitInquiryHandler(validData(), ctx);
    expect(getState().rateLimitRef.update).toHaveBeenCalledWith(
      expect.objectContaining({
        count: '__incr_1__',
      }),
    );
  });

  it('resets rate limit bucket after window expires', async () => {
    const ctx = makeContext({appId: 'test-app'});
    const old = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
    mockRateLimitExists(10, {toMillis: () => old});
    mockFetchTurnstile(true, {success: true});
    await submitInquiryHandler(validData(), ctx);
    expect(getState().rateLimitRef.set).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 1,
        windowStart: '__serverTimestamp__',
      }),
    );
  });

  it('throws resource-exhausted when rate limit exceeded', async () => {
    const ctx = makeContext({appId: 'test-app'});
    const now = Date.now();
    mockRateLimitExists(5, {toMillis: () => now});
    mockFetchTurnstile(true, {success: true});
    await expect(submitInquiryHandler(validData(), ctx)).rejects.toThrow(
      new functions.https.HttpsError(
        'resource-exhausted',
        'Rate limit exceeded. Try again later.',
      ),
    );
  });

  /* -- Success ----------------------------------------------------- */
  it('creates inquiry document and returns inquiryId', async () => {
    const ctx = makeContext({appId: 'test-app'});
    mockRateLimitNotExists();
    mockFetchTurnstile(true, {success: true});
    const result = await submitInquiryHandler(validData(), ctx);

    expect(getState().inquiryRef.set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Іван Петренко',
        phone: '+380671234567',
        email: 'ivan@example.com',
        service: 'Консультація',
        message: 'Тестове звернення',
        status: 'new',
        createdAt: '__serverTimestamp__',
      }),
    );
    expect(result).toEqual({inquiryId: 'inq-abc'});
  });
});
