import {sendPushToClient, sendPushToLawyer, PushPayload} from '../src/push';

/* ------------------------------------------------------------------ */
//  Self-contained jest.mock factory that creates a global state object
//  with jest.fn() instances. The source code will use these functions,
//  and the test can mutate/inspect them after the fact.
/* ------------------------------------------------------------------ */
jest.mock('firebase-admin', () => {
  const s = ((globalThis as any).__pushState__ = (globalThis as any).__pushState__ || {});
  if (!s.send) {
    s.send = jest.fn();
    s.add = jest.fn(() => Promise.resolve());
    s.docG = jest.fn();
    s.docU = jest.fn(() => Promise.resolve());
    s.docD = jest.fn(() => Promise.resolve());
    s.docS = jest.fn(() => Promise.resolve());
    s.devicesG = jest.fn(() => Promise.resolve({docs: []}));
  }

  // Shared doc reference used throughout the whole chain;
  // this is important because removeInvalidToken re-creates userRef.
  const sharedDoc = {
    get: jest.fn(() => s.docG()),
    update: jest.fn((d: any) => s.docU(d)),
    delete: jest.fn(() => s.docD()),
    set: jest.fn((d: any) => s.docS(d)),
    collection: jest.fn(() => ({
      get: jest.fn(() => s.devicesG()),
      doc: jest.fn(() => sharedDoc),
    })),
  };

  function makeCol() {
    return {
      doc: jest.fn(() => sharedDoc),
      add: jest.fn((d: any) => s.add(d)),
    };
  }
  function makeDb() {
    return {
      collection: jest.fn(() => makeCol()),
    };
  }
  const dbFactory = jest.fn(() => makeDb());
  dbFactory.FieldValue = {
    serverTimestamp: jest.fn(() => '__server_timestamp__'),
    delete: jest.fn(() => '__field_delete__'),
    increment: jest.fn((n: number) => `__incr_${n}__`),
  };
  return {
    initializeApp: jest.fn(),
    firestore: dbFactory,
    messaging: jest.fn(() => ({
      send: jest.fn((...args: any[]) => s.send(...args)),
    })),
  };
});

function getState(): any {
  return (globalThis as any).__pushState__;
}

function mockTokenDoc(fcmToken?: string) {
  getState().devicesG.mockResolvedValueOnce({docs: []});
  getState().docG.mockResolvedValue({
    data: () => (fcmToken ? {fcmToken} : {}),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.values(getState()).forEach((fn: any) => fn.mockReset?.());
  getState().devicesG.mockResolvedValue({docs: []});
  getState().docG.mockResolvedValue({data: () => ({})});
});

/* ================================================================== */

describe('sendPushToClient', () => {
  const payload: PushPayload = {
    title: 'Hello',
    body: 'World',
    data: {clientId: 'c1'},
  };

  it('sends push when client has legacy fcmToken', async () => {
    mockTokenDoc('token-abc');
    getState().send.mockResolvedValue('message-id-1');

    await sendPushToClient('client-1', payload);

    expect(getState().send).toHaveBeenCalledTimes(1);
    const message = getState().send.mock.calls[0][0];
    expect(message.token).toBe('token-abc');
    expect(message.notification.title).toBe('Hello');
  });

  it('does nothing when no token', async () => {
    mockTokenDoc(undefined);

    await sendPushToClient('client-1', payload);

    expect(getState().send).not.toHaveBeenCalled();
  });

  it('retries on transient failure and succeeds on second attempt', async () => {
    mockTokenDoc('token-abc');
    getState().send
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce('message-id-2');

    await sendPushToClient('client-1', payload);

    expect(getState().send).toHaveBeenCalledTimes(2);
  });

  it('removes invalid token on messaging/registration-token-not-registered', async () => {
    mockTokenDoc('bad-token');
    getState().send.mockRejectedValue({code: 'messaging/registration-token-not-registered'});

    await sendPushToClient('client-1', payload);

    expect(getState().docD).toHaveBeenCalled();
    expect(getState().docU).toHaveBeenCalledWith(
      {fcmToken: '__field_delete__'},
    );
  });

  it('writes dead-letter after all retries exhausted', async () => {
    mockTokenDoc('token-abc');
    getState().send.mockRejectedValue(new Error('Permanent failure'));

    await sendPushToClient('client-1', payload);

    // sendPushToClient swallows errors via Promise.allSettled, so it resolves
    expect(getState().send).toHaveBeenCalledTimes(4); // initial + 3 retries
    expect(getState().add).toHaveBeenCalledWith(
      expect.objectContaining({
        payload,
        targetId: 'client-1',
        targetRole: 'client',
        retriedCount: 3,
        error: expect.any(Object),
      }),
    );
  });
});

describe('sendPushToLawyer', () => {
  const payload: PushPayload = {
    title: 'Нове повідомлення',
    body: 'Текст',
  };

  it('sends push when lawyer has legacy fcmToken', async () => {
    mockTokenDoc('lawyer-token-1');
    getState().send.mockResolvedValue('message-id-3');

    await sendPushToLawyer('lawyer-1', payload);

    expect(getState().send).toHaveBeenCalledTimes(1);
    const message = getState().send.mock.calls[0][0];
    expect(message.token).toBe('lawyer-token-1');
  });

  it('does nothing when lawyer has no token', async () => {
    mockTokenDoc(undefined);

    await sendPushToLawyer('lawyer-1', payload);

    expect(getState().send).not.toHaveBeenCalled();
  });
});
