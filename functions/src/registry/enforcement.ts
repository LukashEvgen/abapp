import * as functions from 'firebase-functions';
import {getCached, setCached, fetchJson, assertAppCheck} from './common';

// Ministry of Justice open data API for enforcement proceedings
const MINJUST_API_BASE = 'https://public-api.minjust.gov.ua/api/open_data/v1';

export async function searchEnforcementHandler(data: any, context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  assertAppCheck(context);

  const query: string = (data.query || '').toString().trim();
  if (!query || query.length < 2) {
    throw new functions.https.HttpsError('invalid-argument', 'Query must be at least 2 characters');
  }

  const cached = await getCached('enforcement', query);
  if (cached) {
    return {source: 'cache', results: cached};
  }

  let results: any[] = [];

  try {
    // Search by debtor code or name (public open data endpoint)
    const isCode = /^\d{8,10}$/.test(query.replace(/\s/g, ''));
    const url = isCode
      ? `${MINJUST_API_BASE}/enforcement_proceedings?searchCode=${encodeURIComponent(query.replace(/\s/g, ''))}&page=1&pageSize=20`
      : `${MINJUST_API_BASE}/enforcement_proceedings?searchName=${encodeURIComponent(query)}&page=1&pageSize=20`;

    const json = await fetchJson(url);
    const items = Array.isArray(json) ? json : json?.data ? json.data : json?.items ? json.items : [];
    results = items.map((item: any) => ({
      id: item.id || item.vpNumber || '',
      number: item.vpNumber || item.number || '—',
      status: item.stateName || item.status || item.vpState || '—',
      debtor: item.debtorName || item.debtor || item.personName || '—',
      debtorCode: item.debtorCode || item.edrpou || item.personCode || '',
      collector: item.collectorName || item.collector || '—',
      collectorCode: item.collectorCode || '',
      subject: item.subjectExecution || item.subject || '—',
      amount: item.amount || item.debtAmount || item.sumDebt || '',
      department: item.stateDepartmentName || item.department || item.vpDepartment || '—',
      dateOpen: item.dateOpen || item.dateStart || item.openDate || '',
      dateClose: item.dateClose || item.dateEnd || item.closeDate || '',
      raw: item,
    }));
  } catch (e) {
    functions.logger.warn('Enforcement fetch failed', {error: (e as Error).message, query});
  }

  await setCached('enforcement', query, results);
  return {source: 'api', results};
}
