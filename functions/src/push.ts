import * as admin from 'firebase-admin';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface RetryConfig {
  maxRetries: number;
  delaysMs: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delaysMs: [500, 1000, 2000],
};

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Write a failed push payload to the dead-letter collection.
 */
async function writeFailedPush(
  payload: PushPayload,
  targetId: string,
  targetRole: 'client' | 'lawyer',
  error: unknown,
  retriedCount: number,
): Promise<void> {
  try {
    await admin.firestore().collection('failedPushes').add({
      payload,
      targetId,
      targetRole,
      error:
        error instanceof Error
          ? {message: error.message, name: error.name}
          : {message: String(error), name: 'unknown'},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      retriedCount,
    });
  } catch (dlqErr) {
    console.error('Failed to write dead-letter entry', dlqErr);
  }
}

/**
 * Send an FCM push with exponential-backoff retries.
 * On final failure the payload is written to the `failedPushes` collection.
 */
async function sendWithRetry(
  targetId: string,
  fcmToken: string,
  payload: PushPayload,
  targetRole: 'client' | 'lawyer',
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<void> {
  const message: admin.messaging.Message = {
    token: fcmToken,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data || {},
  };

  let lastError: unknown;
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      await admin.messaging().send(message);
      return; // success
    } catch (err) {
      lastError = err;
      console.warn(
        `FCM send failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}):`,
        err,
      );
      if (attempt < retryConfig.maxRetries) {
        await sleep(retryConfig.delaysMs[attempt] ?? 2000);
      }
    }
  }

  await writeFailedPush(payload, targetId, targetRole, lastError, retryConfig.maxRetries);
  throw lastError;
}

async function removeInvalidToken(
  collection: 'clients' | 'lawyers',
  userId: string,
  token: string,
): Promise<void> {
  const userRef = admin.firestore().collection(collection).doc(userId);
  try {
    await userRef.collection('devices').doc(token).delete();
    const userDoc = await userRef.get();
    if (userDoc.data()?.fcmToken === token) {
      await userRef.update({fcmToken: admin.firestore.FieldValue.delete()});
    }
  } catch (e) {
    console.error('Failed to remove invalid token', token, e);
  }
}

export async function sendPushToClient(
  clientId: string,
  payload: PushPayload,
): Promise<void> {
  const devicesSnap = await admin
    .firestore()
    .collection('clients')
    .doc(clientId)
    .collection('devices')
    .get();

  const tokens = devicesSnap.docs.map(d => d.id).filter(Boolean);
  // Fallback to single legacy token
  if (tokens.length === 0) {
    const clientDoc = await admin.firestore().collection('clients').doc(clientId).get();
    const legacy = clientDoc.data()?.fcmToken as string | undefined;
    if (legacy) tokens.push(legacy);
  }
  if (tokens.length === 0) return;

  const results = await Promise.allSettled(
    tokens.map(async token => {
      try {
        await sendWithRetry(clientId, token, payload, 'client');
      } catch (err: any) {
        if (err.code === 'messaging/registration-token-not-registered') {
          await removeInvalidToken('clients', clientId, token);
        } else {
          console.error('Push send error for client', clientId, err);
        }
      }
    }),
  );
  const successes = results.filter(r => r.status === 'fulfilled');
  if (successes.length === 0) {
    console.error('No pushes succeeded for client', clientId);
  }
}

export async function sendPushToLawyer(
  lawyerId: string,
  payload: PushPayload,
): Promise<void> {
  const devicesSnap = await admin
    .firestore()
    .collection('lawyers')
    .doc(lawyerId)
    .collection('devices')
    .get();

  const tokens = devicesSnap.docs.map(d => d.id).filter(Boolean);
  if (tokens.length === 0) {
    const lawyerDoc = await admin.firestore().collection('lawyers').doc(lawyerId).get();
    const legacy = lawyerDoc.data()?.fcmToken as string | undefined;
    if (legacy) tokens.push(legacy);
  }
  if (tokens.length === 0) return;

  const results = await Promise.allSettled(
    tokens.map(async token => {
      try {
        await sendWithRetry(lawyerId, token, payload, 'lawyer');
      } catch (err: any) {
        if (err.code === 'messaging/registration-token-not-registered') {
          await removeInvalidToken('lawyers', lawyerId, token);
        } else {
          console.error('Push send error for lawyer', lawyerId, err);
        }
      }
    }),
  );
  const successes = results.filter(r => r.status === 'fulfilled');
  if (successes.length === 0) {
    console.error('No pushes succeeded for lawyer', lawyerId);
  }
}
