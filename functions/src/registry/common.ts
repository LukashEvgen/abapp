import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const CACHE_TTL_HOURS = 24;
const CACHE_COLLECTION = 'registry_cache';

function cacheKey(registry: string, query: string): string {
  return `${registry}:${query.trim().toLowerCase()}`;
}

async function getCached(registry: string, query: string): Promise<any | null> {
  const key = cacheKey(registry, query);
  const doc = await db.collection(CACHE_COLLECTION).doc(key).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  const cachedAt = data.cachedAt?.toDate?.() ? data.cachedAt.toDate() : new Date(data.cachedAt);
  const ageHours = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60);
  if (ageHours > CACHE_TTL_HOURS) return null;
  return data.result;
}

async function setCached(registry: string, query: string, result: any): Promise<void> {
  const key = cacheKey(registry, query);
  await db.collection(CACHE_COLLECTION).doc(key).set({
    registry,
    query: query.trim().toLowerCase(),
    result,
    cachedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function fetchJson(url: string, options?: RequestInit): Promise<any> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new functions.https.HttpsError('internal', `HTTP ${response.status} from ${url}`);
  }
  return response.json();
}

export function assertAppCheck(context: functions.https.CallableContext): void {
  if (!context.app) {
    throw new functions.https.HttpsError('failed-precondition', 'App Check token is missing or invalid');
  }
}

export {db, CACHE_TTL_HOURS, CACHE_COLLECTION, cacheKey, getCached, setCached, fetchJson};
