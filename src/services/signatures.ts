import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

export interface SignatureRecord {
  id: string;
  documentId: string;
  status: 'pending' | 'signed' | 'failed' | 'cancelled';
  signedAt?: FirebaseFirestoreTypes.Timestamp | null;
  signerName?: string;
  signerIdentifier?: string; // ЄДРПОУ / РНОКПП
  signatureHash?: string;
  signatureType?: 'QES' | 'SES' | 'AES';
  verificationUrl?: string;
  errorMessage?: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp | null;
}

export async function getSignatures(
  clientId: string,
  caseId: string,
  documentId: string,
): Promise<SignatureRecord[]> {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .doc(documentId)
    .collection('signatures')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()} as SignatureRecord));
}

export async function createSignSession(
  clientId: string,
  caseId: string,
  documentId: string,
  documentName: string,
  documentHash: string,
): Promise<{sessionId: string; signUrl: string}> {
  const callable = functions().httpsCallable('createSignSession');
  const result = await callable({
    clientId,
    caseId,
    documentId,
    documentName,
    documentHash,
  });
  return result.data as {sessionId: string; signUrl: string};
}

export async function completeSignSession(
  sessionId: string,
): Promise<SignatureRecord> {
  const callable = functions().httpsCallable('completeSignSession');
  const result = await callable({sessionId});
  return result.data as SignatureRecord;
}

/**
 * One-step callable that creates a signature record in Firestore.
 * Preferred over createSignSession / completeSignSession for simple flows.
 */
export async function signDocument(
  clientId: string,
  caseId: string,
  documentId: string,
  documentName: string,
  documentHash: string,
): Promise<SignatureRecord> {
  const callable = functions().httpsCallable('signDocument');
  const result = await callable({
    clientId,
    caseId,
    documentId,
    documentName,
    documentHash,
  });
  return result.data as SignatureRecord;
}

export async function addSignatureStub(
  clientId: string,
  caseId: string,
  documentId: string,
  signature: Omit<SignatureRecord, 'id'>,
): Promise<string> {
  const ref = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .doc(documentId)
    .collection('signatures')
    .doc();
  await ref.set({
    ...signature,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export function getSignaturesRealtime(
  clientId: string,
  caseId: string,
  documentId: string,
  callback: (sigs: SignatureRecord[]) => void,
): () => void {
  return firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .doc(documentId)
    .collection('signatures')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot => {
        callback(
          snapshot.docs.map(d => ({id: d.id, ...d.data()} as SignatureRecord)),
        );
      },
      err => {
        console.warn('signaturesRealtime error', err);
        callback([]);
      },
    );
}
