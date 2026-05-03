import firestore from '@react-native-firebase/firestore';
import {DocumentReference, Query} from '@react-native-firebase/firestore';
import {PaginatedResult} from './clients';
import {PAGE_SIZE} from './constants';

export interface Inquiry {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  status?: 'new' | 'in_progress' | 'resolved';
  createdAt?: firestore.Timestamp | null;
}

export async function getInquiries(): Promise<Inquiry[]> {
  const snapshot = await firestore()
    .collection('inquiries')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()} as Inquiry));
}

export async function getInquiriesPaginated(
  cursor?: firestore.DocumentSnapshot,
): Promise<PaginatedResult<Inquiry>> {
  let q: Query = firestore()
    .collection('inquiries')
    .orderBy('createdAt', 'desc');
  if (cursor) {
    q = q.startAfter(cursor);
  }
  const snapshot = await q.limit(PAGE_SIZE).get();
  const data = snapshot.docs.map(d => ({id: d.id, ...d.data()} as Inquiry));
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  return {
    data,
    nextCursor: lastDoc,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

export async function submitInquiry(
  data: Omit<Inquiry, 'id' | 'createdAt' | 'status'>,
): Promise<string> {
  const ref: DocumentReference = firestore().collection('inquiries').doc();
  await ref.set({
    ...data,
    status: 'new',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}
