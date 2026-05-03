import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

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
  documentHash: string;
  signerName?: string;
  signerIdentifier?: string;
  signatureType?: 'QES' | 'SES' | 'AES';
}

/**
 * One-step document signing callable.
 * Validates the caller is authenticated, verifies they belong to the case,
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

  // Optional ownership / role validation: check caller UID belongs to the lawyer list
  const uid = context.auth.uid;
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
    status: 'signed',
    signedAt: now,
    signerName: signerName || context.auth.token?.name || 'Юрист (КЕП)',
    signerIdentifier:
      signerIdentifier || context.auth.token?.edrpou || uid,
    signatureHash: documentHash,
    signatureType,
    verificationUrl: 'https://id.gov.ua/verify',
    signedByUid: uid,
    createdAt: now,
  };

  // Also mark the document as signed for quick filtering
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
