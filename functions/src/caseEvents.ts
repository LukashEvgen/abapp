import * as functions from 'firebase-functions';
import {sendPushToClient} from './push';

export const onCaseEventCreateHandler = async (
  snap: functions.firestore.DocumentSnapshot,
  context: functions.EventContext,
): Promise<void> => {
  const clientId = context.params.clientId;
  const caseId = context.params.caseId;
  const event = snap.data();
  if (!event) {
    return;
  }

  try {
    await sendPushToClient(clientId, {
      title: 'Нова подія у справі',
      body: event.text || 'Додано нову подію',
      data: {
        clientId,
        caseId,
        eventId: snap.id,
        type: 'caseEvent',
      },
    });
  } catch (err) {
    console.error('Push failed for case event', snap.id, err);
  }
};

export const onCaseUpdateHandler = async (
  change: functions.Change<functions.firestore.DocumentSnapshot>,
  context: functions.EventContext,
): Promise<void> => {
  const clientId = context.params.clientId;
  const caseId = context.params.caseId;
  const before = change.before.data();
  const after = change.after.data();

  if (!before || !after) {
    return;
  }

  const statusChanged = before.status !== after.status;
  const progressChanged = before.progress !== after.progress;

  if (!statusChanged && !progressChanged) {
    return;
  }

  let title = 'Оновлення справи';
  let body = `Справу оновлено`;

  if (statusChanged) {
    title = 'Зміна статусу справи';
    body = `Новий статус: ${after.status || '—'}`;
  } else if (progressChanged) {
    title = 'Прогрес справи змінено';
    body = `Прогрес: ${after.progress ?? '—'}%`;
  }

  try {
    await sendPushToClient(clientId, {
      title,
      body,
      data: {
        clientId,
        caseId,
        type: 'caseUpdate',
        ...(statusChanged ? {status: String(after.status || '')} : {}),
        ...(progressChanged ? {progress: String(after.progress ?? '')} : {}),
      },
    });
  } catch (err) {
    console.error('Push failed for case update', caseId, err);
  }
};
