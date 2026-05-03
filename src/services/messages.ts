import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

export interface Message {
  id: string;
  text: string;
  from: 'client' | 'lawyer' | 'admin';
  timestamp?: FirebaseFirestoreTypes.Timestamp | null;
  read?: boolean;
}

export function getMessagesRealtime(
  clientId: string,
  callback: (messages: Message[]) => void,
): () => void {
  const unsubscribe = firestore()
    .collection('clients')
    .doc(clientId)
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .onSnapshot(
      (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
        const messages = snapshot.docs.map(
          d => ({id: d.id, ...d.data()} as Message),
        );
        callback(messages);
      },
      (error: Error) => {
        console.error('Messages snapshot error', error);
      },
    );
  return unsubscribe;
}

export async function sendMessage(
  clientId: string,
  text: string,
  from: 'client' | 'lawyer' | 'admin' = 'client',
): Promise<string> {
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
}

export async function resetUnreadCount(clientId: string): Promise<void> {
  await firestore()
    .collection('clients')
    .doc(clientId)
    .update({unreadCount: 0});
}

export async function markMessagesRead(
  clientId: string,
  messageIds: string[],
): Promise<void> {
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
}
