import * as functions from 'firebase-functions';
import {getCached, setCached, fetchJson, assertAppCheck} from './common';

// Opendatabot free API for basic company lookup (no auth key needed for limited queries)
const ODB_API_BASE = 'https://opendatabot.ua/api/v2';

export async function searchEdrHandler(data: any, context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  assertAppCheck(context);

  const query: string = (data.query || '').toString().trim();
  if (!query || query.length < 2) {
    throw new functions.https.HttpsError('invalid-argument', 'Query must be at least 2 characters');
  }

  const cached = await getCached('edr', query);
  if (cached) {
    return {source: 'cache', results: cached};
  }

  let results: any[] = [];

  // Try company search by code or name via Opendatabot
  try {
    const isCode = /^\d{8,10}$/.test(query.replace(/\s/g, ''));
    const url = isCode
      ? `${ODB_API_BASE}/company/${encodeURIComponent(query.replace(/\s/g, ''))}`
      : `${ODB_API_BASE}/company?name=${encodeURIComponent(query)}`;

    const json = await fetchJson(url);
    const items = Array.isArray(json) ? json : json?.data ? json.data : json ? [json] : [];
    results = items.map((item: any) => ({
      name: item.full_name || item.short_name || item.name || '—',
      code: item.edrpou || item.code || query,
      type: item.type || (item.fop ? 'ФОП' : 'Юридична особа'),
      status: item.status === 'active' || item.active || item?.state?.text === 'зареєстровано' ? 'active' : 'inactive',
      address: item.address || item.location || '—',
      ceo: item.ceo || item.head || item.founder || '',
      raw: item,
    }));
  } catch (e) {
    functions.logger.warn('EDR fetch failed, returning empty', {error: (e as Error).message, query});
  }

  // Fallback: return a structured empty response so the UI always gets a valid payload
  if (results.length === 0) {
    results = [];
  }

  await setCached('edr', query, results);
  return {source: 'api', results};
}
