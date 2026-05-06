import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {assertAppCheck} from './registry/common';

export interface WriteAuditLogData {
  actorType: 'lawyer' | 'client' | 'system';
  action: string;
  targetCollection: string;
  targetDocId: string;
  clientId?: string;
  caseId?: string;
  details?: Record<string, unknown>;
}

export interface WriteAuditLogResult {
  logId: string;
}

/**
 * Callable handler that writes an audit log entry into the `auditLogs` collection.
 * Requires App Check (assertAppCheck) and authenticated user (context.auth).
 */
export const writeAuditLogHandler = async (
  data: WriteAuditLogData,
  context: functions.https.CallableContext,
): Promise<WriteAuditLogResult> => {
  // 1. App Check
  assertAppCheck(context);

  // 2. Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated.',
    );
  }

  // 3. Validate required fields
  const requiredFields: (keyof WriteAuditLogData)[] = [
    'actorType',
    'action',
    'targetCollection',
    'targetDocId',
  ];
  for (const field of requiredFields) {
    if (!data || !data[field]) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Missing required field: ${field}`,
      );
    }
  }

  // 4. Validate actorType enum
  const validActorTypes: WriteAuditLogData['actorType'][] = [
    'lawyer',
    'client',
    'system',
  ];
  if (!validActorTypes.includes(data.actorType)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid actorType. Must be one of: ${validActorTypes.join(', ')}`,
    );
  }

  // 5. Resolve actorId (use auth uid as fallback)
  const actorId = context.auth.uid;

  // 6. Build payload
  const payload: Record<string, unknown> = {
    actorId,
    actorType: data.actorType,
    action: data.action,
    targetCollection: data.targetCollection,
    targetDocId: data.targetDocId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ip: context.rawRequest?.ip || null,
  };

  if (data.clientId) {
    payload.clientId = data.clientId;
  }
  if (data.caseId) {
    payload.caseId = data.caseId;
  }
  if (data.details && Object.keys(data.details).length > 0) {
    payload.details = data.details;
  }

  // 7. Write to Firestore
  const logRef = admin.firestore().collection('auditLogs').doc();
  await logRef.set(payload);

  return {logId: logRef.id};
};
