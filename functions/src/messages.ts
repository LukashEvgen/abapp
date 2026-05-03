import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {sendPushToClient, sendPushToLawyer} from './push';

export const onMessageCreateHandler = async (
  snap: functions.firestore.DocumentSnapshot,
  context: functions.EventContext,
): Promise<void> => {
  const clientId = context.params.clientId;
  if (!clientId) {
    return;
  }

  const msg = snap.data();
  if (!msg) {
    return;
  }

  const clientRef = admin.firestore().collection('clients').doc(clientId);

  // Atomic update of client summary fields
  const summaryUpdate: Record<string, unknown> = {
    lastMessage: msg.text || '',
    lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (msg.from === 'client' && msg.read === false) {
    summaryUpdate.unreadCount = admin.firestore.FieldValue.increment(1);
  }

  try {
    await clientRef.update(summaryUpdate);
  } catch (err) {
    console.error('Failed to update client summary for', clientId, err);
    // Continue to push notifications even if summary update fails
  }

  // Push notification to the other party
  try {
    if (msg.from === 'client') {
      // Notify assigned lawyer only
      const clientDoc = await clientRef.get();
      const clientData = clientDoc.data() || {};
      const targetLawyerId = clientData.lawyerId || clientData.assignedLawyer;
      if (targetLawyerId) {
        await sendPushToLawyer(targetLawyerId, {
          title: 'Нове повідомлення',
          body: msg.text || '',
          data: {
            clientId,
            messageId: snap.id,
            type: 'chat',
          },
        });
      }
    } else if (msg.from === 'lawyer') {
      // Notify client
      await sendPushToClient(clientId, {
        title: 'Нове повідомлення від адвоката',
        body: msg.text || '',
        data: {
          clientId,
          messageId: snap.id,
          type: 'chat',
        },
      });
    }
  } catch (err) {
    console.error('Push notification failed for message', snap.id, err);
  }
};

export const onMessageUpdateHandler = async (
  change: functions.Change<functions.firestore.DocumentSnapshot>,
  context: functions.EventContext,
): Promise<void> => {
  const clientId = context.params.clientId;
  if (!clientId) {
    return;
  }

  const before = change.before.data();
  const after = change.after.data();

  if (!before || !after) {
    return;
  }

  const wentFromUnreadToRead = before.read === false && after.read === true;
  const isFromClient = after.from === 'client';

  if (wentFromUnreadToRead && isFromClient) {
    const clientRef = admin.firestore().collection('clients').doc(clientId);
    try {
      await clientRef.update({
        unreadCount: admin.firestore.FieldValue.increment(-1),
      });
    } catch (err) {
      console.error('Failed to decrement unreadCount for', clientId, err);
    }
  }
};
