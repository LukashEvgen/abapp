import firestore from '@react-native-firebase/firestore';
import {DocumentReference, Query} from '@react-native-firebase/firestore';
import {PaginatedResult} from './clients';
import {PAGE_SIZE} from './constants';

export interface Inspection {
  id: string;
  title?: string;
  dateStart?: firestore.Timestamp | null;
  dateEnd?: firestore.Timestamp | null;
  status?: string;
  result?: string;
}

export async function getInspections(clientId: string): Promise<Inspection[]> {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('inspections')
    .orderBy('dateStart', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()} as Inspection));
}

export async function getInspectionsPaginated(
  clientId: string,
  cursor?: firestore.DocumentSnapshot,
): Promise<PaginatedResult<Inspection>> {
  let q: Query = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('inspections')
    .orderBy('dateStart', 'desc');
  if (cursor) {
    q = q.startAfter(cursor);
  }
  const snapshot = await q.limit(PAGE_SIZE).get();
  const data = snapshot.docs.map(d => ({id: d.id, ...d.data()} as Inspection));
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  return {
    data,
    nextCursor: lastDoc,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

export async function getInspectionById(
  clientId: string,
  inspectionId: string,
): Promise<Inspection | null> {
  const doc = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('inspections')
    .doc(inspectionId)
    .get();
  if (!doc.exists) return null;
  return {id: doc.id, ...doc.data()} as Inspection;
}
