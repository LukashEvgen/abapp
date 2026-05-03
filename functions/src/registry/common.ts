import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as https from 'https';

const db = admin.firestore();
const CACHE_TTL_HOURS = 24;
const CACHE_COLLECTION = 'registry_cache';

function cacheKey(registry: string, query: string): string {
  return `${registry}:${query.trim().toLowerCase()}`;
}

async function getCached(registry: string, query: string): Promise<any | null> {
  const key = cacheKey(registry, query);
  const doc = await db.collection(CACHE_COLLECTION).doc(key).get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data()!;
  const cachedAt = data.cachedAt?.toDate?.()
    ? data.cachedAt.toDate()
    : new Date(data.cachedAt);
  const ageHours = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60);
  if (ageHours > CACHE_TTL_HOURS) {
    return null;
  }
  return data.result;
}

async function setCached(
  registry: string,
  query: string,
  result: any,
): Promise<void> {
  const key = cacheKey(registry, query);
  await db.collection(CACHE_COLLECTION).doc(key).set({
    registry,
    query: query.trim().toLowerCase(),
    result,
    cachedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

function httpGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {timeout: 15000}, res => {
      let body = '';
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} from ${url}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error(`Invalid JSON from ${url}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

function assertAppCheck(context: functions.https.CallableContext): void {
  if (!context || !context.app) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'App Check token is missing or invalid. Request rejected.',
    );
  }
}

export function fetchJson(url: string): Promise<any> {
  return httpGet(url);
}

export {
  db,
  CACHE_TTL_HOURS,
  CACHE_COLLECTION,
  cacheKey,
  getCached,
  setCached,
  httpGet,
  assertAppCheck,
};
