import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import functions from '@react-native-firebase/functions';
import {PaginatedResult} from './clients';
import {PAGE_SIZE} from './constants';

export type ScanStatus = 'pending' | 'clean' | 'infected';

export interface DocumentItem {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  type: string;
  size: number;
  mimeType?: string;
  sha256?: string;
  scanned?: boolean;
  scanStatus?: ScanStatus;
  scannedAt?: FirebaseFirestoreTypes.Timestamp | null;
  uploadedAt?: FirebaseFirestoreTypes.Timestamp | null;
}

export async function getDocuments(
  clientId: string,
  caseId: string,
): Promise<DocumentItem[]> {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .orderBy('uploadedAt', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()} as DocumentItem));
}

export async function getDocumentsPaginated(
  clientId: string,
  caseId: string,
  cursor?: FirebaseFirestoreTypes.DocumentSnapshot,
): Promise<PaginatedResult<DocumentItem>> {
  let q = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .orderBy('uploadedAt', 'desc');
  if (cursor) {
    q = q.startAfter(cursor);
  }
  const snapshot = await q.limit(PAGE_SIZE).get();
  const data = snapshot.docs.map(
    d => ({id: d.id, ...d.data()} as DocumentItem),
  );
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  return {
    data,
    nextCursor: lastDoc,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

export async function getDocumentById(
  clientId: string,
  caseId: string,
  documentId: string,
): Promise<DocumentItem | null> {
  const doc = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .doc(documentId)
    .get();
  return doc.exists ? ({id: doc.id, ...doc.data()} as DocumentItem) : null;
}

export async function uploadDocument(
  clientId: string,
  caseId: string,
  filePath: string,
  name: string,
  fileSize: number,
  mimeType: string,
  sha256: string,
  onProgress?: (progress: number) => void,
): Promise<{id: string; url: string}> {
  const storagePath = `clients/${clientId}/cases/${caseId}/documents/${name}`;
  const ref = storage().ref(storagePath);
  const task = ref.putFile(filePath, {contentType: mimeType});
  if (onProgress) {
    task.on('state_changed', snapshot => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    });
  }
  await task;
  const url = await ref.getDownloadURL();
  const docRef = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .doc();
  await docRef.set({
    name,
    url,
    storagePath,
    type: name.split('.').pop() || '',
    size: fileSize,
    mimeType,
    sha256,
    scanStatus: 'pending',
    scannedAt: null,
    uploadedAt: firestore.FieldValue.serverTimestamp(),
  });
  return {id: docRef.id, url};
}

export interface ScanDocumentResult {
  scanned: boolean;
  scanStatus?: ScanStatus;
  scannedAt?: FirebaseFirestoreTypes.Timestamp | null;
}

export async function updateDocumentScanStatus(
  clientId: string,
  caseId: string,
  documentId: string,
  scanStatus: ScanStatus,
  scannedAt: Date,
): Promise<void> {
  await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .doc(documentId)
    .update({
      scanStatus,
      scannedAt: firestore.Timestamp.fromDate(scannedAt),
    });
}

export async function callScanDocument(
  clientId: string,
  caseId: string,
  documentId: string,
  storagePath: string,
  sha256?: string,
  mimeType?: string,
): Promise<ScanDocumentResult> {
  const scanDoc = functions().httpsCallable('scanDocument');
  const result = await scanDoc({
    clientId,
    caseId,
    documentId,
    storagePath,
    sha256,
    mimeType,
  });
  const data = (result.data ?? {}) as {
    scanned?: boolean;
    scanStatus?: string;
    scannedAt?: any;
  };
  const scanStatus: ScanStatus =
    data.scanStatus === 'clean' || data.scanStatus === 'infected'
      ? data.scanStatus
      : 'pending';
  const scanned =
    typeof data.scanned === 'boolean' ? data.scanned : scanStatus === 'clean';
  const scannedAt = data.scannedAt ?? null;
  return {
    scanned,
    scanStatus,
    scannedAt,
  };
}
