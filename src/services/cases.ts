import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {PaginatedResult} from './clients';
import {PAGE_SIZE} from './constants';

export interface Case {
  id: string;
  title: string;
  caseNumber?: string;
  court?: string;
  status?: string;
  progress?: number;
  nextHearing?: FirebaseFirestoreTypes.Timestamp | null;
  createdAt?: FirebaseFirestoreTypes.Timestamp | null;
}

export interface CaseEvent {
  id: string;
  text?: string;
  actor?: 'lawyer' | 'court' | 'opponent';
  date?: FirebaseFirestoreTypes.Timestamp | null;
}

export async function getCases(clientId: string): Promise<Case[]> {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()} as Case));
}

export async function getCasesPaginated(
  clientId: string,
  cursor?: FirebaseFirestoreTypes.DocumentSnapshot,
): Promise<PaginatedResult<Case>> {
  let q: FirebaseFirestoreTypes.Query = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .orderBy('createdAt', 'desc');
  if (cursor) {
    q = q.startAfter(cursor);
  }
  const snapshot = await q.limit(PAGE_SIZE).get();
  const data = snapshot.docs.map(d => ({id: d.id, ...d.data()} as Case));
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  return {
    data,
    nextCursor: lastDoc,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

export async function getCaseById(
  clientId: string,
  caseId: string,
): Promise<Case | null> {
  const doc = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .get();
  if (!doc.exists) {
    return null;
  }
  return {id: doc.id, ...doc.data()} as Case;
}

export async function createCase(
  clientId: string,
  data: Omit<Case, 'id' | 'createdAt' | 'progress' | 'status'>,
): Promise<string> {
  const ref = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc();
  await ref.set({
    ...data,
    progress: 0,
    status: 'Розглядається',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateCaseProgress(
  clientId: string,
  caseId: string,
  progress: number,
): Promise<void> {
  await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .update({progress});
}

export async function updateCase(
  clientId: string,
  caseId: string,
  data: Partial<Case>,
): Promise<void> {
  await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .update(data);
}

export async function getCaseEvents(
  clientId: string,
  caseId: string,
): Promise<CaseEvent[]> {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('events')
    .orderBy('date', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()} as CaseEvent));
}

export async function getCaseEventsPaginated(
  clientId: string,
  caseId: string,
  cursor?: FirebaseFirestoreTypes.DocumentSnapshot,
): Promise<PaginatedResult<CaseEvent>> {
  let q: FirebaseFirestoreTypes.Query = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('events')
    .orderBy('date', 'desc');
  if (cursor) {
    q = q.startAfter(cursor);
  }
  const snapshot = await q.limit(PAGE_SIZE).get();
  const data = snapshot.docs.map(
    (d: FirebaseFirestoreTypes.DocumentSnapshot) =>
      ({id: d.id, ...d.data()} as CaseEvent),
  );
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  return {
    data,
    nextCursor: lastDoc,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

export async function addCaseEvent(
  clientId: string,
  caseId: string,
  eventData: Omit<CaseEvent, 'id' | 'date'>,
): Promise<string> {
  const ref = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('events')
    .doc();
  await ref.set({
    ...eventData,
    date: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export function getCasesRealtime(
  clientId: string,
  callback: (cases: Case[]) => void,
): () => void {
  const unsubscribe = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot =>
        callback(snapshot.docs.map(d => ({id: d.id, ...d.data()} as Case))),
      error => console.error('Cases realtime error', error),
    );
  return unsubscribe;
}

// ---------------------------------------------------------------------------
// Realtime listeners
// ---------------------------------------------------------------------------

export function getCaseByIdRealtime(
  clientId: string,
  caseId: string,
  callback: (c: Case | null) => void,
): () => void {
  const unsubscribe = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .onSnapshot(
      doc =>
        callback(doc.exists ? ({id: doc.id, ...doc.data()} as Case) : null),
      error => console.error('Case realtime error', error),
    );
  return unsubscribe;
}

export function getCaseEventsRealtime(
  clientId: string,
  caseId: string,
  callback: (events: CaseEvent[]) => void,
): () => void {
  const unsubscribe = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('events')
    .orderBy('date', 'desc')
    .onSnapshot(
      snapshot =>
        callback(
          snapshot.docs.map(d => ({id: d.id, ...d.data()} as CaseEvent)),
        ),
      error => console.error('Case events realtime error', error),
    );
  return unsubscribe;
}
