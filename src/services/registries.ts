import functions from '@react-native-firebase/functions';

export type RegistryType = 'edr' | 'court' | 'enforcement';

export interface EdrResult {
  name: string;
  code: string;
  type: string;
  status: 'active' | 'inactive';
  address: string;
  ceo: string;
  raw?: any;
}

export interface CourtResult {
  id: string;
  number: string;
  date: string;
  court: string;
  type: string;
  subject: string;
  parties: string;
  link: string;
  raw?: any;
}

export interface EnforcementResult {
  id: string;
  number: string;
  status: string;
  debtor: string;
  debtorCode: string;
  collector: string;
  collectorCode: string;
  subject: string;
  amount: string;
  department: string;
  dateOpen: string;
  dateClose: string;
  raw?: any;
}

export interface RegistrySearchResponse<T> {
  source: 'cache' | 'api';
  results: T[];
}

export async function searchEdr(query: string): Promise<RegistrySearchResponse<EdrResult>> {
  const callable = functions().httpsCallable('searchEdr');
  const resp = await callable({query});
  return resp.data as RegistrySearchResponse<EdrResult>;
}

export async function searchCourt(query: string): Promise<RegistrySearchResponse<CourtResult>> {
  const callable = functions().httpsCallable('searchCourt');
  const resp = await callable({query});
  return resp.data as RegistrySearchResponse<CourtResult>;
}

export async function searchEnforcement(query: string): Promise<RegistrySearchResponse<EnforcementResult>> {
  const callable = functions().httpsCallable('searchEnforcement');
  const resp = await callable({query});
  return resp.data as RegistrySearchResponse<EnforcementResult>;
}
