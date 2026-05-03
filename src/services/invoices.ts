import firestore from '@react-native-firebase/firestore';
import {DocumentReference, Query} from '@react-native-firebase/firestore';
import {PaginatedResult} from './clients';
import {PAGE_SIZE} from './constants';

export interface Invoice {
  id: string;
  amount?: number;
  description?: string;
  title?: string;
  number?: string;
  status?: 'pending' | 'paid' | 'cancelled' | 'overdue';
  createdAt?: firestore.Timestamp | null;
  paidAt?: firestore.Timestamp | null;
  gateway?: 'liqpay' | 'wayforpay';
  orderId?: string;
  dueDate?: firestore.Timestamp | null;
}

export async function getInvoices(clientId: string): Promise<Invoice[]> {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('invoices')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()} as Invoice));
}

export async function getInvoicesPaginated(
  clientId: string,
  cursor?: firestore.DocumentSnapshot,
): Promise<PaginatedResult<Invoice>> {
  let q: Query = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('invoices')
    .orderBy('createdAt', 'desc');
  if (cursor) {
    q = q.startAfter(cursor);
  }
  const snapshot = await q.limit(PAGE_SIZE).get();
  const data = snapshot.docs.map(d => ({id: d.id, ...d.data()} as Invoice));
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  return {
    data,
    nextCursor: lastDoc,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

export async function createInvoice(
  clientId: string,
  data: Omit<Invoice, 'id' | 'createdAt' | 'status'>,
): Promise<string> {
  const ref: DocumentReference = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('invoices')
    .doc();
  await ref.set({
    ...data,
    status: 'pending',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}
