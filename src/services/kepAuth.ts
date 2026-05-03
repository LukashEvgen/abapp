import functions from '@react-native-firebase/functions';

export interface KEPAuthResult {
  authorizeUrl: string;
  state: string;
}

/**
 * Start KEP OAuth 2.0 flow with id.gov.ua.
 * Returns the authorize URL and a state string for PKCE.
 */
export async function initiateKEPAuth(): Promise<KEPAuthResult> {
  const callable = functions().httpsCallable('initiateKEPAuth');
  const result = await callable({});
  return result.data as KEPAuthResult;
}

export interface ExchangeKEPCodeResult {
  success: boolean;
}

/**
 * Exchange authorization code returned by id.gov.ua redirect.
 */
export async function exchangeKEPCode(
  code: string,
  state: string,
): Promise<ExchangeKEPCodeResult> {
  const callable = functions().httpsCallable('exchangeKEPCode');
  const result = await callable({code, state});
  return result.data as ExchangeKEPCodeResult;
}

export interface KEPTokenResult {
  accessToken: string;
  expiresAt: number;
}

/**
 * Get (or refresh) a valid KEP access token.
 */
export async function getKEPToken(): Promise<KEPTokenResult> {
  const callable = functions().httpsCallable('getKEPToken');
  const result = await callable({});
  return result.data as KEPTokenResult;
}
