import functions from '@react-native-firebase/functions';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {PAGE_SIZE} from './constants';

export interface Client {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp | null;
  lastMessage?: string;
  lastMessageAt?: FirebaseFirestoreTypes.Timestamp | null;
  unreadCount?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function getClientsPaginated(
  cursor?: string,
): Promise<PaginatedResult<Client>> {
  let q: FirebaseFirestoreTypes.Query = firestore()
    .collection('clients')
    .orderBy('createdAt', 'desc');
  if (cursor) {
    q = q.startAfter(cursor);
  }
  const snapshot = await q.limit(PAGE_SIZE).get();
  const data = snapshot.docs.map(d => ({id: d.id, ...d.data()} as Client));
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  return {
    data,
    nextCursor: lastDoc ? lastDoc.id : null,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

export async function getClientById(clientId: string): Promise<Client | null> {
  const doc = await firestore().collection('clients').doc(clientId).get();
  if (!doc.exists) {
    return null;
  }
  return {id: doc.id, ...doc.data()} as Client;
}

export async function createClient(
  data: Omit<Client, 'id' | 'createdAt'>,
): Promise<string> {
  const ref: FirebaseFirestoreTypes.DocumentReference = firestore()
    .collection('clients')
    .doc();
  await ref.set({
    ...data,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateClientLastMessage(
  clientId: string,
  text: string,
): Promise<void> {
  await firestore().collection('clients').doc(clientId).update({
    lastMessage: text,
    lastMessageAt: firestore.FieldValue.serverTimestamp(),
  });
}

export async function getAllClients(): Promise<Client[]> {
  const snapshot = await firestore()
    .collection('clients')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()} as Client));
}

export async function getAdminMessagesSummaryPaginated(
  cursor?: string,
): Promise<PaginatedResult<AdminMessageSummary>> {
  const result = await functions().httpsCallable('getAdminMessagesSummary')({cursor});
  const {items, nextCursor, hasMore} = result.data as {
    items: AdminMessageSummary[];
    nextCursor: string | null;
    hasMore: boolean;
  };
  return {data: items, nextCursor, hasMore};
}

export interface AdminMessageSummary {
  clientId: string;
  name: string;
  lastMessage: string;
  unreadCount: number;
}

export async function getAdminMessagesSummary(): Promise<
  AdminMessageSummary[]
> {
  const result = await functions().httpsCallable('getAdminMessagesSummary')();
  return (result.data as {items: AdminMessageSummary[]}).items;
}

export function getClientsRealtime(
  callback: (clients: Client[]) => void,
  limitCount: number = 100,
): () => void {
  const unsubscribe = firestore()
    .collection('clients')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .onSnapshot(
      snapshot =>
        callback(snapshot.docs.map(d => ({id: d.id, ...d.data()} as Client))),
      error => console.error('Clients realtime error', error),
    );
  return unsubscribe;
}
