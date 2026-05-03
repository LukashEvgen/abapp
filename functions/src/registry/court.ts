import * as functions from 'firebase-functions';
import {getCached, setCached, fetchJson, assertAppCheck} from './common';

// Court decisions registry open API (Reyestr)
const COURT_API_BASE = 'https://public-api.reyestr.court.gov.ua';

export async function searchCourtHandler(data: any, context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  assertAppCheck(context);

  const query: string = (data.query || '').toString().trim();
  if (!query || query.length < 2) {
    throw new functions.https.HttpsError('invalid-argument', 'Query must be at least 2 characters');
  }

  const cached = await getCached('court', query);
  if (cached) {
    return {source: 'cache', results: cached};
  }

  let results: any[] = [];

  try {
    // Search judgments by party name or case number (public API, no key)
    const url = `${COURT_API_BASE}/documents?text=${encodeURIComponent(query)}&page=1&pageSize=20`;
    const json = await fetchJson(url);
    const items = Array.isArray(json) ? json : json?.data ? json.data : json?.items ? json.items : [];
    results = items.map((item: any) => ({
      id: item.id || item.number || '',
      number: item.number || item.caseNumber || item.judgmentCode || '—',
      date: item.judgmentDate || item.date || item.datePublication || '',
      court: item.courtName || item.court || item.judgmentCourt || '—',
      type: item.typeName || item.judgmentType || item.forma || '—',
      subject: item.subject || item.caseName || item.judgmentForm || '',
      parties: item.parties || item.judgmentParties || '',
      link: item.link || item.judgmentDocUrl || '',
      raw: item,
    }));
  } catch (e) {
    functions.logger.warn('Court fetch failed', {error: (e as Error).message, query});
  }

  await setCached('court', query, results);
  return {source: 'api', results};
}
