import * as functions from 'firebase-functions';

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
      })),
    })),
  })),
  FieldValue: {serverTimestamp: jest.fn()},
}));

import {assertAppCheck} from '../src/registry/common';

describe('assertAppCheck', () => {
  it('does not throw when context.app is present', () => {
    const context = {app: {appId: 'test-app'}} as any as functions.https.CallableContext;
    expect(() => assertAppCheck(context)).not.toThrow();
  });

  it('throws failed-precondition when context.app is null', () => {
    const context = {app: null} as any as functions.https.CallableContext;
    expect(() => assertAppCheck(context)).toThrow(
      new functions.https.HttpsError(
        'failed-precondition',
        'App Check token is missing or invalid. Request rejected.',
      ),
    );
  });

  it('throws failed-precondition when context.app is undefined', () => {
    const context = {} as any as functions.https.CallableContext;
    expect(() => assertAppCheck(context)).toThrow(
      new functions.https.HttpsError(
        'failed-precondition',
        'App Check token is missing or invalid. Request rejected.',
      ),
    );
  });
});
