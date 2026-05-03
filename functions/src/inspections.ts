import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {sendPushToClient, sendPushToLawyer} from './push';

export const onInspectionCreateHandler = async (
  snap: functions.firestore.DocumentSnapshot,
  context: functions.EventContext,
): Promise<void> => {
  const clientId = context.params.clientId;
  const inspection = snap.data();
  if (!inspection) {
    return;
  }

  try {
    await sendPushToClient(clientId, {
      title: 'Призначена перевірка',
      body: inspection.title || 'Додано нову перевірку',
      data: {
        clientId,
        inspectionId: snap.id,
        type: 'inspection',
      },
    });
  } catch (err) {
    console.error('Push failed for inspection', snap.id, err);
  }
};

export const onInquiryCreateHandler = async (
  snap: functions.firestore.DocumentSnapshot,
  _context: functions.EventContext,
): Promise<void> => {
  const inquiry = snap.data();
  if (!inquiry) {
    return;
  }

  try {
    const lawyersSnap = await admin.firestore().collection('lawyers').get();
    const pushPromises = lawyersSnap.docs.map(lawyerDoc =>
      sendPushToLawyer(lawyerDoc.id, {
        title: 'Нове звернення',
        body: inquiry.name
          ? `Звернення від ${inquiry.name}`
          : 'Отримано нове звернення',
        data: {
          inquiryId: snap.id,
          type: 'inquiry',
        },
      }),
    );
    await Promise.all(pushPromises);
  } catch (err) {
    console.error('Push failed for inquiry', snap.id, err);
  }
};
