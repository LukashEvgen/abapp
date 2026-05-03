import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {DocumentReference} from '@react-native-firebase/firestore';
import {PaginatedResult} from './clients';
import {PAGE_SIZE} from './constants';

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
  uploadedAt?: firestore.Timestamp | null;
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
  cursor?: firestore.DocumentSnapshot,
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
      const progress =
        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    });
  }
  await task;
  const url = await ref.getDownloadURL();
  const docRef: DocumentReference = firestore()
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
    scanned: false,
    uploadedAt: firestore.FieldValue.serverTimestamp(),
  });
  return {id: docRef.id, url};
}
