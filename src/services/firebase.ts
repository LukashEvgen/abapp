import firestore, {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

import {
  Client,
  Case,
  CaseEvent,
  Document,
  Invoice,
  InvoiceStatus,
  Inspection,
  Message,
  Inquiry,
  InquiryStatus,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mapDoc = <T extends {id: string}>(
  doc: FirebaseFirestoreTypes.DocumentSnapshot,
): T => ({id: doc.id, ...doc.data()} as T);

const mapDocs = <T extends {id: string}>(
  snap: FirebaseFirestoreTypes.QuerySnapshot,
): T[] => snap.docs.map(d => ({id: d.id, ...d.data()} as T));

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export const getClients = async (): Promise<Client[]> => {
  const snapshot = await firestore().collection('clients').get();
  return mapDocs<Client>(snapshot);
};

export const getClientById = async (clientId: string): Promise<Client | null> => {
  const doc = await firestore().collection('clients').doc(clientId).get();
  if (!doc.exists) {
    return null;
  }
  return mapDoc<Client>(doc);
};

export const createClient = async (data: Omit<Client, 'id'>): Promise<string> => {
  const ref = firestore().collection('clients').doc();
  await ref.set({...data, createdAt: firestore.FieldValue.serverTimestamp()});
  return ref.id;
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const getCases = async (clientId: string): Promise<Case[]> => {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .orderBy('createdAt', 'desc')
    .get();
  return mapDocs<Case>(snapshot);
};

export const getCaseById = async (clientId: string, caseId: string): Promise<Case | null> => {
  const doc = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .get();
  if (!doc.exists) {
    return null;
  }
  return mapDoc<Case>(doc);
};

export const createCase = async (clientId: string, data: Omit<Case, 'id'>): Promise<string> => {
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
};

export const updateCaseProgress = async (clientId: string, caseId: string, progress: number): Promise<void> => {
  await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .update({progress});
};

export const updateCase = async (clientId: string, caseId: string, data: Partial<Case>): Promise<void> => {
  await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .update(data);
};

// ---------------------------------------------------------------------------
// Case Events
// ---------------------------------------------------------------------------

export const getCaseEvents = async (clientId: string, caseId: string): Promise<CaseEvent[]> => {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('events')
    .orderBy('date', 'desc')
    .get();
  return mapDocs<CaseEvent>(snapshot);
};

export const addCaseEvent = async (clientId: string, caseId: string, eventData: Omit<CaseEvent, 'id'>): Promise<string> => {
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
};

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export const getDocuments = async (clientId: string, caseId: string): Promise<Document[]> => {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .orderBy('uploadedAt', 'desc')
    .get();
  return mapDocs<Document>(snapshot);
};

export const uploadDocument = async (
  clientId: string,
  caseId: string,
  filePath: string,
  name: string,
  onProgress?: (progress: number) => void,
): Promise<{id: string; url: string}> => {
  const storagePath = `clients/${clientId}/cases/${caseId}/documents/${name}`;
  const ref = storage().ref(storagePath);
  const task = ref.putFile(filePath);
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
    size: 0,
    uploadedAt: firestore.FieldValue.serverTimestamp(),
  });
  return {id: docRef.id, url};
};

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export const getInvoices = async (clientId: string): Promise<Invoice[]> => {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('invoices')
    .orderBy('createdAt', 'desc')
    .get();
  return mapDocs<Invoice>(snapshot);
};

export const createInvoice = async (clientId: string, data: Omit<Invoice, 'id'>): Promise<string> => {
  const ref = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('invoices')
    .doc();
  await ref.set({
    ...data,
    status: 'pending' as InvoiceStatus,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
};

// ---------------------------------------------------------------------------
// Inspections
// ---------------------------------------------------------------------------

export const getInspections = async (clientId: string): Promise<Inspection[]> => {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('inspections')
    .orderBy('dateStart', 'desc')
    .get();
  return mapDocs<Inspection>(snapshot);
};

export const getInspectionById = async (clientId: string, inspectionId: string): Promise<Inspection | null> => {
  const doc = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('inspections')
    .doc(inspectionId)
    .get();
  if (!doc.exists) {
    return null;
  }
  return mapDoc<Inspection>(doc);
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const getMessages = (
  clientId: string,
  callback: (messages: Message[]) => void,
): (() => void) => {
  return firestore()
    .collection('clients')
    .doc(clientId)
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .onSnapshot(snapshot => {
      const messages = mapDocs<Message>(snapshot);
      callback(messages);
    });
};

export const sendMessage = async (clientId: string, text: string, from: 'client' | 'lawyer' = 'client'): Promise<string> => {
  const ref = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('messages')
    .doc();
  await ref.set({
    text,
    from,
    timestamp: firestore.FieldValue.serverTimestamp(),
    read: false,
  });
  return ref.id;
};

export const markMessagesRead = async (clientId: string, messageIds: string[]): Promise<void> => {
  const batch = firestore().batch();
  messageIds.forEach(id => {
    const ref = firestore()
      .collection('clients')
      .doc(clientId)
      .collection('messages')
      .doc(id);
    batch.update(ref, {read: true});
  });
  await batch.commit();
};

// ---------------------------------------------------------------------------
// Inquiries
// ---------------------------------------------------------------------------

export const submitInquiry = async (data: Omit<Inquiry, 'id'>): Promise<string> => {
  const ref = firestore().collection('inquiries').doc();
  await ref.set({
    ...data,
    status: 'new' as InquiryStatus,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
};

export const getInquiries = async (): Promise<Inquiry[]> => {
  const snapshot = await firestore()
    .collection('inquiries')
    .orderBy('createdAt', 'desc')
    .get();
  return mapDocs<Inquiry>(snapshot);
};

// ---------------------------------------------------------------------------
// Admin functions
// ---------------------------------------------------------------------------

export const getAllClients = async (): Promise<Client[]> => {
  const snapshot = await firestore()
    .collection('clients')
    .orderBy('createdAt', 'desc')
    .get();
  return mapDocs<Client>(snapshot);
};

export interface AdminMessageSummary {
  clientId: string;
  name: string;
  lastMessage: string;
  unreadCount: number;
}

export const getAdminMessagesSummary = async (): Promise<AdminMessageSummary[]> => {
  const snapshot = await firestore().collection('clients').get();
  const summaries: AdminMessageSummary[] = [];
  for (const doc of snapshot.docs) {
    const client = mapDoc<Client>(doc);
    const msgSnap = await firestore()
      .collection('clients')
      .doc(doc.id)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    const unreadSnap = await firestore()
      .collection('clients')
      .doc(doc.id)
      .collection('messages')
      .where('read', '==', false)
      .where('from', '==', 'client')
      .get();
    summaries.push({
      clientId: doc.id,
      name: client.name || 'Без імені',
      lastMessage: msgSnap.docs[0]?.data()?.text || '',
      unreadCount: unreadSnap.docs.length,
    });
  }
  return summaries;
};
