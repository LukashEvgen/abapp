import * as functions from 'firebase-functions';
import {onMessageCreateHandler} from '../src/messages';

/* ------------------------------------------------------------------ */
//  Self-contained jest.mock factories
/* ------------------------------------------------------------------ */

// firebase-admin mock
jest.mock('firebase-admin', () => {
  const s = ((globalThis as any).__messageState__ = (globalThis as any).__messageState__ || {});
  if (!s.docU) {
    s.docU = jest.fn(() => Promise.resolve());
    s.docG = jest.fn(() => Promise.resolve({data: () => ({})}));
  }
  function makeDoc() {
    return {
      get: jest.fn(() => s.docG()),
      update: jest.fn((d: any) => s.docU(d)),
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
    increment: jest.fn((n: number) => `__incr_${n}__`),
  };
  return {
    initializeApp: jest.fn(),
    firestore: dbFactory,
  };
});

// push module mock
jest.mock('../src/push', () => {
  const s = (globalThis as any).__messageState__;
  if (!s.sendToClient) {
    s.sendToClient = jest.fn(() => Promise.resolve());
    s.sendToLawyer = jest.fn(() => Promise.resolve());
  }
  return {
    sendPushToClient: jest.fn((...args: any[]) => s.sendToClient(...args)),
    sendPushToLawyer: jest.fn((...args: any[]) => s.sendToLawyer(...args)),
  };
});

function getState(): any {
  return (globalThis as any).__messageState__;
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.values(getState()).forEach((fn: any) => fn.mockReset?.());
  getState().docG.mockResolvedValue({data: () => ({})});
});

function makeSnap(data: any, id = 'msg-1'): functions.firestore.DocumentSnapshot {
  return {
    id,
    data: () => data,
  } as any;
}

function makeContext(clientId = 'client-1'): functions.EventContext {
  return {
    params: {clientId, messageId: 'msg-1'},
  } as any;
}

/* ================================================================== */

describe('onMessageCreateHandler', () => {
  it('updates client summary fields', async () => {
    const snap = makeSnap({text: 'Привіт', from: 'client', read: false});
    const ctx = makeContext();

    await onMessageCreateHandler(snap, ctx);

    expect(getState().docU).toHaveBeenCalledWith(
      expect.objectContaining({
        lastMessage: 'Привіт',
        lastMessageAt: '__ts__',
        unreadCount: '__incr_1__',
      }),
    );
  });

  it('sends push to assigned lawyer when msg.from === client', async () => {
    getState().docG.mockResolvedValueOnce({
      data: () => ({lawyerId: 'lawyer-1'}),
    });
    const snap = makeSnap({text: 'Привіт', from: 'client', read: false});
    const ctx = makeContext();

    await onMessageCreateHandler(snap, ctx);

    expect(getState().sendToLawyer).toHaveBeenCalledWith('lawyer-1', {
      title: 'Нове повідомлення',
      body: 'Привіт',
      data: {
        clientId: 'client-1',
        messageId: 'msg-1',
        type: 'chat',
      },
    });
    expect(getState().sendToClient).not.toHaveBeenCalled();
  });

  it('falls back to assignedLawyer when lawyerId is absent', async () => {
    getState().docG.mockResolvedValueOnce({
      data: () => ({assignedLawyer: 'lawyer-2'}),
    });
    const snap = makeSnap({text: 'Тест', from: 'client', read: false});
    const ctx = makeContext();

    await onMessageCreateHandler(snap, ctx);

    expect(getState().sendToLawyer).toHaveBeenCalledWith('lawyer-2', expect.any(Object));
  });

  it('skips lawyer push when no assigned lawyer found', async () => {
    getState().docG.mockResolvedValueOnce({data: () => ({})});
    const snap = makeSnap({text: 'Привіт', from: 'client', read: false});
    const ctx = makeContext();

    await onMessageCreateHandler(snap, ctx);

    expect(getState().sendToLawyer).not.toHaveBeenCalled();
    expect(getState().sendToClient).not.toHaveBeenCalled();
  });

  it('sends push to client when msg.from === lawyer', async () => {
    const snap = makeSnap({text: 'Відповідь', from: 'lawyer'});
    const ctx = makeContext();

    await onMessageCreateHandler(snap, ctx);

    expect(getState().sendToClient).toHaveBeenCalledWith('client-1', {
      title: 'Нове повідомлення від адвоката',
      body: 'Відповідь',
      data: {
        clientId: 'client-1',
        messageId: 'msg-1',
        type: 'chat',
      },
    });
    expect(getState().sendToLawyer).not.toHaveBeenCalled();
  });

  it('handles missing msg.text gracefully', async () => {
    getState().docG.mockResolvedValueOnce({data: () => ({lawyerId: 'lawyer-1'})});
    const snap = makeSnap({from: 'client', read: false});
    const ctx = makeContext();

    await onMessageCreateHandler(snap, ctx);

    expect(getState().sendToLawyer).toHaveBeenCalledWith(
      'lawyer-1',
      expect.objectContaining({body: ''}),
    );
  });

  it('does not crash when summary update fails', async () => {
    getState().docU.mockRejectedValueOnce(new Error('Firestore down'));
    const snap = makeSnap({text: 'x', from: 'client'});
    const ctx = makeContext();

    await expect(onMessageCreateHandler(snap, ctx)).resolves.toBeUndefined();
  });
});
