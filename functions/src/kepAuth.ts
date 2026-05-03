import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import fetch from 'node-fetch';

/* ------------------------------------------------------------------ */
//  Lazy-loaded environment config
/* ------------------------------------------------------------------ */
function getKepConfig() {
  const cfg = functions.config().kep || {};
  return {
    clientId: cfg.client_id || '',
    clientSecret: cfg.client_secret || '',
    redirectUri: cfg.redirect_uri || '',
    authorizeUrl: cfg.authorize_url || 'https://id.gov.ua/authorize',
    tokenUrl: cfg.token_url || 'https://id.gov.ua/token',
  };
}

interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

function makePKCE(): PKCEPair {
  // 128 bytes → 171 raw chars in base64url ~ 128 visible.
  const codeVerifier = crypto.randomBytes(128).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return {codeVerifier, codeChallenge};
}

function requireKepConfig() {
  const cfg = getKepConfig();
  if (!cfg.clientId || !cfg.clientSecret || !cfg.redirectUri) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Kep OAuth config missing. Set kep.client_id, kep.client_secret and kep.redirect_uri via firebase functions:config:set',
    );
  }
}

/* ================================================================
   1. initiateKEPAuth  – return authorize URL + state
   ================================================================ */
export const initiateKEPAuthHandler = async (
  _data: unknown,
  context: functions.https.CallableContext,
): Promise<{authorizeUrl: string; state: string}> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  requireKepConfig();

  const cfg = getKepConfig();
  const state = crypto.randomUUID();
  const {codeVerifier, codeChallenge} = makePKCE();

  // Store pending PKCE verifier keyed by state
  await admin
    .firestore()
    .collection('lawyers')
    .doc(context.auth.uid)
    .collection('kepAuth')
    .doc(state)
    .set({
      codeVerifier,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000), // 10 min
      exchanged: false,
    });

  const url = new URL(cfg.authorizeUrl);
  url.searchParams.set('client_id', cfg.clientId);
  url.searchParams.set('redirect_uri', cfg.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'sign');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');

  return {authorizeUrl: url.toString(), state};
};

/* ================================================================
   2. exchangeKEPCode  – called by redirect handler (or callable)
   ================================================================ */
export interface ExchangeKEPCodeData {
  code: string;
  state: string;
}

export const exchangeKEPCodeHandler = async (
  data: ExchangeKEPCodeData,
  context: functions.https.CallableContext,
): Promise<{success: boolean}> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  requireKepConfig();

  const {code, state} = data;
  if (!code || !state) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing code or state.');
  }

  const pendingRef = admin
    .firestore()
    .collection('lawyers')
    .doc(context.auth.uid)
    .collection('kepAuth')
    .doc(state);

  const pendingDoc = await pendingRef.get();
  if (!pendingDoc.exists) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'No pending auth session found for this state.',
    );
  }

  const pending = pendingDoc.data()!;
  if (pending.exchanged === true) {
    throw new functions.https.HttpsError(
      'already-exists',
      'This authorization code has already been exchanged.',
    );
  }

  const codeVerifier: string = pending.codeVerifier;
  const cfg = getKepConfig();

  const tokenRes = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: cfg.redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error('id.gov.ua token exchange failed', tokenRes.status, text);
    throw new functions.https.HttpsError(
      'unknown',
      `Token exchange failed: ${tokenRes.status} – ${text}`,
    );
  }

  const tokenJson = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (tokenJson.error) {
    throw new functions.https.HttpsError(
      'unknown',
      `Token error: ${tokenJson.error} – ${tokenJson.error_description || ''}`,
    );
  }

  const expiresAt = admin.firestore.Timestamp.fromMillis(
    Date.now() + (tokenJson.expires_in || 3600) * 1000,
  );

  const tokenDoc: Record<string, any> = {
    accessToken: tokenJson.access_token,
    tokenType: tokenJson.token_type || 'Bearer',
    scope: tokenJson.scope || 'sign',
    expiresAt,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (tokenJson.refresh_token) {
    tokenDoc.refreshToken = tokenJson.refresh_token;
  }

  const batch = admin.firestore().batch();
  batch.set(
    admin.firestore().collection('lawyers').doc(context.auth.uid).collection('kepTokens').doc('id.gov.ua'),
    tokenDoc,
  );
  batch.update(pendingRef, {exchanged: true, exchangedAt: admin.firestore.FieldValue.serverTimestamp()});
  await batch.commit();

  return {success: true};
};

/* ================================================================
   3. getKEPToken  – returns current or refreshed access token
   ================================================================ */
export const getKEPTokenHandler = async (
  _data: unknown,
  context: functions.https.CallableContext,
): Promise<{accessToken: string; expiresAt: number}> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  requireKepConfig();

  const tokenRef = admin
    .firestore()
    .collection('lawyers')
    .doc(context.auth.uid)
    .collection('kepTokens')
    .doc('id.gov.ua');

  const doc = await tokenRef.get();
  if (!doc.exists) {
    throw new functions.https.HttpsError('not-found', 'No KEP token found. Initiate OAuth first.');
  }

  const data = doc.data()!;
  let accessToken: string = data.accessToken;
  let expiresAtMs: number = data.expiresAt ? (data.expiresAt as admin.firestore.Timestamp).toMillis() : 0;

  // Refresh if expires in < 5 minutes
  if (Date.now() + 5 * 60 * 1000 > expiresAtMs) {
    const refreshToken: string | undefined = data.refreshToken;
    if (!refreshToken) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Token expired and no refresh token available.',
      );
    }

    const cfg = getKepConfig();
    const refreshRes = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!refreshRes.ok) {
      const text = await refreshRes.text();
      console.error('id.gov.ua token refresh failed', refreshRes.status, text);
      throw new functions.https.HttpsError(
        'unknown',
        `Token refresh failed: ${refreshRes.status} – ${text}`,
      );
    }

    const refreshJson = (await refreshRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
      scope?: string;
    };

    accessToken = refreshJson.access_token;
    expiresAtMs = Date.now() + (refreshJson.expires_in || 3600) * 1000;

    const updateData: Record<string, any> = {
      accessToken,
      expiresAt: admin.firestore.Timestamp.fromMillis(expiresAtMs),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (refreshJson.refresh_token) {
      updateData.refreshToken = refreshJson.refresh_token;
    }
    if (refreshJson.token_type) {
      updateData.tokenType = refreshJson.token_type;
    }
    if (refreshJson.scope) {
      updateData.scope = refreshJson.scope;
    }

    await tokenRef.update(updateData);
  }

  return {accessToken, expiresAt: expiresAtMs};
};
