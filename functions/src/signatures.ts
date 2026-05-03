import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

interface SignSessionData {
  clientId: string;
  caseId: string;
  documentId: string;
  documentName: string;
  documentHash: string;
}

/**
 * Creates a signing session record in Firestore and returns a sessionId + signUrl.
 * In production, the signUrl would be the id.gov.ua OAuth authorize URL or
 * a deep-link into the Diia app.
 */
export const createSignSessionHandler = async (
  data: SignSessionData,
  context: functions.https.CallableContext,
): Promise<{sessionId: string; signUrl: string}> => {
  const {clientId, caseId, documentId, documentName, documentHash} = data;

  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated.',
    );
  }

  // Optional: validate the caller is the lawyer/admin for this case
  const sessionRef = admin
    .firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .doc(documentId)
    .collection('signSessions')
    .doc();

  const sessionId = sessionRef.id;

  await sessionRef.set({
    clientId,
    caseId,
    documentId,
    documentName,
    documentHash,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: context.auth.uid,
  });

  // Placeholder URL — in production this would be the id.gov.ua authorize URL
  // with redirect_uri pointing to the app (deep link or custom scheme).
  const signUrl = `https://id.gov.ua/sign?session=${sessionId}&hash=${encodeURIComponent(
    documentHash,
  )}`;

  return {sessionId, signUrl};
};

/**
 * Completes a signing session after the Diia / id.gov.ua flow finishes.
 * Expects the client to call this with the sessionId; in a real flow
 * id.gov.ua would redirect back with a signed payload that we verify here.
 */
export const completeSignSessionHandler = async (
  data: {sessionId: string},
  context: functions.https.CallableContext,
): Promise<Record<string, any>> => {
  const {sessionId} = data;

  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated.',
    );
  }

  // In a real implementation we would verify the signature from id.gov.ua here.
  // For now we look up the session, mark it signed, and write a signature record.
  const sessionSnap = await admin
    .firestore()
    .collectionGroup('signSessions')
    .where(admin.firestore.FieldPath.documentId(), '==', sessionId)
    .limit(1)
    .get();

  if (sessionSnap.empty) {
    throw new functions.https.HttpsError(
      'not-found',
      'Signing session not found.',
    );
  }

  const sessionDoc = sessionSnap.docs[0];
  const session = sessionDoc.data();

  const signatureRef = admin
    .firestore()
    .collection('clients')
    .doc(session.clientId)
    .collection('cases')
    .doc(session.caseId)
    .collection('documents')
    .doc(session.documentId)
    .collection('signatures')
    .doc();

  const signature = {
    id: signatureRef.id,
    documentId: session.documentId,
    status: 'signed',
    signedAt: admin.firestore.FieldValue.serverTimestamp(),
    signerName: context.auth.token?.name || 'Юрист (КЕП)',
    signerIdentifier: context.auth.token?.edrpou || context.auth.uid,
    signatureHash: session.documentHash,
    signatureType: 'QES',
    verificationUrl: 'https://id.gov.ua/verify',
    sessionId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const batch = admin.firestore().batch();
  batch.update(sessionDoc.ref, {
    status: 'signed',
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  batch.set(signatureRef, signature);
  await batch.commit();

  return signature;
};

// ---------------------------------------------------------------------------
// Single-step signDocument callable
// ---------------------------------------------------------------------------
interface SignDocumentData {
  clientId: string;
  caseId: string;
  documentId: string;
  documentName: string;
  documentHash?: string;
  storagePath?: string;
  accessToken?: string;
  signerName?: string;
  signerIdentifier?: string;
  signatureType?: 'QES' | 'SES' | 'AES';
}

/* ================================================================
   Helper: fetch or refresh KEP access token for the caller
   ================================================================ */
async function getValidKEPToken(uid: string): Promise<string> {
  const tokenRef = admin
    .firestore()
    .collection('lawyers')
    .doc(uid)
    .collection('kepTokens')
    .doc('id.gov.ua');

  const doc = await tokenRef.get();
  if (!doc.exists) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'No KEP token found. Complete OAuth flow first.',
    );
  }

  const data = doc.data()!;
  let accessToken: string = data.accessToken;
  let expiresAtMs: number = data.expiresAt
    ? (data.expiresAt as admin.firestore.Timestamp).toMillis()
    : 0;

  // Refresh if expires in < 5 minutes
  if (Date.now() + 5 * 60 * 1000 > expiresAtMs) {
    const refreshToken: string | undefined = data.refreshToken;
    if (!refreshToken) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'KEP token expired and no refresh token available.',
      );
    }

    const cfg = functions.config().kep || {};
    const clientId = cfg.client_id || '';
    const clientSecret = cfg.client_secret || '';
    if (!clientId || !clientSecret) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Kep OAuth config missing.',
      );
    }

    const tokenUrl = cfg.token_url || 'https://id.gov.ua/token';
    const refreshRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!refreshRes.ok) {
      const text = await refreshRes.text();
      console.error('id.gov.ua token refresh failed', refreshRes.status, text);
      throw new functions.https.HttpsError(
        'unknown',
        `KEP token refresh failed: ${refreshRes.status} – ${text}`,
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

  return accessToken;
}

/* ================================================================
   Helper: download file from Storage and compute SHA-256
   ================================================================ */
async function hashFromStorage(path: string): Promise<string> {
  const bucket = admin.storage().bucket();
  const file = bucket.file(path);
  const [buffer] = await file.download();
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/* ================================================================
   Helper: call id.gov.ua remote signing API
   ================================================================ */
interface IdGovUaSignResponse {
  status: 'signed' | 'failed' | 'pending';
  signatureHash?: string;
  signatureData?: string;
  timestamp?: string;
  errorMessage?: string;
}

async function callIdGovUaSign(
  accessToken: string,
  documentHash: string,
): Promise<IdGovUaSignResponse> {
  const cfg = functions.config().kep || {};
  const signUrl = cfg.sign_url || 'https://id.gov.ua/api/v1/sign';

  const res = await fetch(signUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({hash: documentHash, algorithm: 'sha256'}),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('id.gov.ua sign API error', res.status, text);

    if (res.status === 400) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `KEP sign rejected: ${text}`,
      );
    }
    if (res.status === 401 || res.status === 403) {
      throw new functions.https.HttpsError(
        'permission-denied',
        `KEP access denied: ${text}`,
      );
    }
    if (res.status >= 500) {
      throw new functions.https.HttpsError(
        'unavailable',
        `KEP service unavailable (${res.status}): ${text}`,
      );
    }
    throw new functions.https.HttpsError(
      'unknown',
      `KEP sign failed: ${res.status} – ${text}`,
    );
  }

  const json = (await res.json()) as IdGovUaSignResponse;
  return json;
}

/**
 * One-step document signing callable.
 * Validates the caller is authenticated, verifies they belong to the case,
 * downloads the document from Storage (if storagePath provided), computes
 * or uses the provided hash, calls id.gov.ua sign API with a valid KEP token,
 * writes a signature record in Firestore under
 *   clients/{clientId}/cases/{caseId}/documents/{documentId}/signatures
 * and returns the created signature object.
 */
export const signDocumentHandler = async (
  data: SignDocumentData,
  context: functions.https.CallableContext,
): Promise<Record<string, any>> => {
  const {
    clientId,
    caseId,
    documentId,
    documentName,
    documentHash,
    storagePath,
    accessToken: explicitAccessToken,
    signerName,
    signerIdentifier,
    signatureType = 'QES',
  } = data;

  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated.',
    );
  }

  const uid = context.auth.uid;

  // --- case authorization --------------------------------------------------
  const caseDoc = await admin
    .firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .get();

  if (!caseDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Case not found.',
    );
  }

  const caseData = caseDoc.data() || {};
  const assignedLawyers: string[] = caseData.assignedLawyers || [];
  const caseOwner = caseData.lawyerId || caseData.owner || null;
  const isAuthorized =
    assignedLawyers.includes(uid) || caseOwner === uid;

  if (!isAuthorized) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only assigned lawyers or the case owner can sign documents.',
    );
  }

  // --- resolve document hash -----------------------------------------------
  let hash = documentHash || '';
  if (!hash && storagePath) {
    try {
      hash = await hashFromStorage(storagePath);
    } catch {
      console.error('Failed to download/hash document');
    }
  }

  // --- ensure we have a valid KEP access token -------------------------------
  const token = explicitAccessToken || (await getValidKEPToken(uid));

  // --- call id.gov.ua sign API ---------------------------------------------
  const signResponse = await callIdGovUaSign(token, hash);

  // --- write signature record -----------------------------------------------
  const signatureRef = admin
    .firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .doc(documentId)
    .collection('signatures')
    .doc();

  const now = admin.firestore.FieldValue.serverTimestamp();
  const signature = {
    id: signatureRef.id,
    documentId,
    documentName: documentName || '',
    status: signResponse.status || 'signed',
    signedAt: now,
    signerName: signerName || context.auth.token?.name || 'Юрист (КЕП)',
    signerIdentifier:
      signerIdentifier || context.auth.token?.edrpou || uid,
    signatureHash: hash,
    signatureType,
    verificationUrl: 'https://id.gov.ua/verify',
    signedByUid: uid,
    createdAt: now,
    ...(signResponse.signatureData
      ? {signatureData: signResponse.signatureData}
      : {}),
    ...(signResponse.errorMessage
      ? {errorMessage: signResponse.errorMessage}
      : {}),
    ...(signResponse.timestamp
      ? {externalTimestamp: signResponse.timestamp}
      : {}),
  };

  const docRef = admin
    .firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .doc(documentId);

  const batch = admin.firestore().batch();
  batch.set(signatureRef, signature);
  batch.update(docRef, {
    lastSignedAt: now,
    signCount: admin.firestore.FieldValue.increment(1),
  });
  await batch.commit();

  return signature;
};
