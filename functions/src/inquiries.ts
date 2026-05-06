import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';
import {assertAppCheck} from './registry/common';
import * as crypto from 'crypto';

const db = admin.firestore();

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getRateLimitKey(context: functions.https.CallableContext): string {
  const raw = context.rawRequest;
  const forwarded = raw?.headers?.['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : raw?.ip) || 'unknown';
  const appId = context.app?.appId || 'no-app';
  return crypto.createHash('sha256').update(`${appId}:${ip}`).digest('hex');
}

async function checkRateLimit(key: string): Promise<void> {
  const ref = db.collection('rate_limits_inquiries').doc(key);
  const now = Date.now();
  const doc = await ref.get();

  if (!doc.exists) {
    await ref.set({
      count: 1,
      windowStart: admin.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  const data = doc.data()!;
  const windowStartMs =
    data.windowStart && typeof data.windowStart.toMillis === 'function'
      ? data.windowStart.toMillis()
      : Number(data.windowStart) || 0;

  if (now - windowStartMs > RATE_LIMIT_WINDOW_MS) {
    await ref.set({
      count: 1,
      windowStart: admin.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  const count = Number(data.count) || 0;
  if (count >= RATE_LIMIT_MAX) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Rate limit exceeded. Try again later.',
    );
  }

  await ref.update({count: admin.firestore.FieldValue.increment(1)});
}

async function verifyTurnstile(token: string, remoteIp?: string): Promise<void> {
  const secret =
    functions.config().turnstile?.secret || process.env.TURNSTILE_SECRET;
  if (!secret) {
    console.warn('Turnstile secret not configured; skipping verification.');
    return;
  }

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);
  if (remoteIp) {
    params.append('remoteip', remoteIp);
  }

  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      body: params,
    },
  );

  if (!res.ok) {
    throw new functions.https.HttpsError(
      'internal',
      'Turnstile verification network error.',
    );
  }

  const json = (await res.json()) as {
    success?: boolean;
    'error-codes'?: string[];
  };
  if (!json.success) {
    console.error('Turnstile verification failed:', json['error-codes']);
    throw new functions.https.HttpsError(
      'permission-denied',
      'Turnstile verification failed.',
    );
  }
}

function validateFields(data: any): {
  name: string;
  phone: string;
  email?: string;
  service?: string;
  message: string;
} {
  const {name, phone, email, service, message} = data || {};
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Name is required.');
  }
  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Phone is required.',
    );
  }
  if (email !== undefined && typeof email !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email must be a string.',
    );
  }
  if (service !== undefined && typeof service !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Service must be a string.',
    );
  }
  if (
    !message ||
    typeof message !== 'string' ||
    message.trim().length === 0
  ) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Message is required.',
    );
  }
  return {
    name: name.trim(),
    phone: phone.trim(),
    email: email?.trim(),
    service: service?.trim(),
    message: message.trim(),
  };
}

export async function submitInquiryHandler(
  data: any,
  context: functions.https.CallableContext,
): Promise<{inquiryId: string}> {
  assertAppCheck(context);

  const remoteIp = (context.rawRequest?.ip as string | undefined) || undefined;
  await checkRateLimit(getRateLimitKey(context));

  const turnstileToken = data?.turnstileToken;
  if (typeof turnstileToken !== 'string' || turnstileToken.length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Turnstile token is required.',
    );
  }
  await verifyTurnstile(turnstileToken, remoteIp);

  const fields = validateFields(data);

  const ref = db.collection('inquiries').doc();
  await ref.set({
    ...fields,
    status: 'new',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {inquiryId: ref.id};
}
