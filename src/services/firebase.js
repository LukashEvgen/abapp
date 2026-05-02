import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

export const getClients = async () => {
  const snapshot = await firestore().collection('clients').get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()}));
};

export const getClientById = async clientId => {
  const doc = await firestore().collection('clients').doc(clientId).get();
  if (!doc.exists) return null;
  return {id: doc.id, ...doc.data()};
};

export const createClient = async data => {
  const ref = firestore().collection('clients').doc();
  await ref.set({...data, createdAt: firestore.FieldValue.serverTimestamp()});
  return ref.id;
};

export const getCases = async clientId => {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()}));
};

export const getCaseById = async (clientId, caseId) => {
  const doc = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .get();
  if (!doc.exists) return null;
  return {id: doc.id, ...doc.data()};
};

export const createCase = async (clientId, data) => {
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

export const updateCaseProgress = async (clientId, caseId, progress) => {
  await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .update({progress});
};

export const getCaseEvents = async (clientId, caseId) => {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('events')
    .orderBy('date', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()}));
};

export const addCaseEvent = async (clientId, caseId, eventData) => {
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

export const getDocuments = async (clientId, caseId) => {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .orderBy('uploadedAt', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()}));
};

export const uploadDocument = async (clientId, caseId, filePath, name, onProgress) => {
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

export const getInvoices = async clientId => {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('invoices')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()}));
};

export const createInvoice = async (clientId, data) => {
  const ref = firestore()
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
};

export const getInspections = async clientId => {
  const snapshot = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('inspections')
    .orderBy('dateStart', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()}));
};

export const getInspectionById = async (clientId, inspectionId) => {
  const doc = await firestore()
    .collection('clients')
    .doc(clientId)
    .collection('inspections')
    .doc(inspectionId)
    .get();
  if (!doc.exists) return null;
  return {id: doc.id, ...doc.data()};
};

export const getMessages = (clientId, callback) => {
  return firestore()
    .collection('clients')
    .doc(clientId)
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .onSnapshot(snapshot => {
      const messages = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
      callback(messages);
    });
};

export const sendMessage = async (clientId, text, from = 'client') => {
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

export const markMessagesRead = async (clientId, messageIds) => {
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

export const submitInquiry = async data => {
  const ref = firestore().collection('inquiries').doc();
  await ref.set({
    ...data,
    status: 'new',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
};

export const getInquiries = async () => {
  const snapshot = await firestore()
    .collection('inquiries')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(d => ({id: d.id, ...d.data()}));
};
