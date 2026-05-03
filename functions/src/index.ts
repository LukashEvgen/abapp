import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

import {onMessageCreateHandler, onMessageUpdateHandler} from './messages';
import {onCaseEventCreateHandler, onCaseUpdateHandler} from './caseEvents';
import {onInspectionCreateHandler, onInquiryCreateHandler} from './inspections';
import {searchEdrHandler} from './registry/edr';
import {searchCourtHandler} from './registry/court';
import {searchEnforcementHandler} from './registry/enforcement';
import {scanDocumentHandler} from './documents';
import {
  createSignSessionHandler,
  completeSignSessionHandler,
  signDocumentHandler,
} from './signatures';
import {
  initiateKEPAuthHandler,
  exchangeKEPCodeHandler,
  getKEPTokenHandler,
} from './kepAuth';
import {onDocumentUploadHandler} from './storageTriggers';


// ---------------------------------------------------------------------------
// Summaries callable function
// ---------------------------------------------------------------------------
const MESSAGES_PAGE_SIZE = 20;

export const getAdminMessagesSummary = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30, enforceAppCheck: true})
  .https.onCall(async (data, context) => {
    // 1. Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Користувач не автентифікований',
      );
    }

    // 2. Role check (must exist in lawyers collection)
    const lawyerDoc = await admin
      .firestore()
      .collection('lawyers')
      .doc(context.auth.uid)
      .get();
    if (!lawyerDoc.exists) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Доступ дозволено лише адвокатам',
      );
    }

    // 3. Pagination cursor / limit
    const cursor: string | undefined = data?.cursor;

    let q: admin.firestore.Query = admin
      .firestore()
      .collection('clients')
      .orderBy('lastMessageAt', 'desc');

    if (cursor) {
      const cursorDoc = await admin
        .firestore()
        .collection('clients')
        .doc(cursor)
        .get();
      if (!cursorDoc.exists) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Невірний pagination cursor',
        );
      }
      q = q.startAfter(cursorDoc);
    }

    const snapshot = await q.limit(MESSAGES_PAGE_SIZE).get();
    const items = snapshot.docs.map(d => {
      const docData = d.data();
      return {
        clientId: d.id,
        name: docData.name || 'Без імені',
        lastMessage: docData.lastMessage || '',
        unreadCount: docData.unreadCount || 0,
      };
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    return {
      items,
      nextCursor: lastDoc ? lastDoc.id : null,
      hasMore: snapshot.docs.length === MESSAGES_PAGE_SIZE,
    } as {
      items: {
        clientId: string;
        name: string;
        lastMessage: string;
        unreadCount: number;
      }[];
      nextCursor: string | null;
      hasMore: boolean;
    };
  });

// ---------------------------------------------------------------------------
// Registry callable functions
// ---------------------------------------------------------------------------
export const searchEdr = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30, enforceAppCheck: true})
  .https.onCall(searchEdrHandler);

export const searchCourt = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30, enforceAppCheck: true})
  .https.onCall(searchCourtHandler);

export const searchEnforcement = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30, enforceAppCheck: true})
  .https.onCall(searchEnforcementHandler);

export const searchOpendatabot = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30, enforceAppCheck: true})
  .https.onCall(searchEdrHandler);

// ---------------------------------------------------------------------------
// Push notification triggers
// ---------------------------------------------------------------------------
export const notifyOnMessageCreate = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30})
  .firestore.document('clients/{clientId}/messages/{messageId}')
  .onCreate(onMessageCreateHandler);

export const notifyOnMessageUpdate = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30})
  .firestore.document('clients/{clientId}/messages/{messageId}')
  .onUpdate(onMessageUpdateHandler);

export const notifyOnCaseEventCreate = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30})
  .firestore.document('clients/{clientId}/cases/{caseId}/events/{eventId}')
  .onCreate(onCaseEventCreateHandler);

export const notifyOnCaseUpdate = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30})
  .firestore.document('clients/{clientId}/cases/{caseId}')
  .onUpdate(onCaseUpdateHandler);

export const notifyOnInvoiceCreate = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30})
  .firestore.document('clients/{clientId}/invoices/{invoiceId}')
  .onCreate(async (snap, context) => {
    const clientId = context.params.clientId;
    const invoice = snap.data();
    if (!invoice) {
      return;
    }

    const {sendPushToClient} = await import('./push');
    try {
      await sendPushToClient(clientId, {
        title: 'Новий рахунок',
        body: `Виставлено рахунок: ${invoice.amount || 0} грн`,
        data: {
          clientId,
          invoiceId: snap.id,
          type: 'invoice',
        },
      });
    } catch (err) {
      console.error('Push failed for invoice', snap.id, err);
    }
  });

export const notifyOnInspectionCreate = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30})
  .firestore.document('clients/{clientId}/inspections/{inspectionId}')
  .onCreate(onInspectionCreateHandler);

export const notifyOnInquiryCreate = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30})
  .firestore.document('inquiries/{inquiryId}')
  .onCreate(onInquiryCreateHandler);

// ---------------------------------------------------------------------------
// Signature & KEP callable functions
// ---------------------------------------------------------------------------
export const createSignSession = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30, enforceAppCheck: true})
  .https.onCall(createSignSessionHandler);

export const completeSignSession = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30, enforceAppCheck: true})
  .https.onCall(completeSignSessionHandler);

export const signDocument = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30, enforceAppCheck: true})
  .https.onCall(signDocumentHandler);

export const initiateKEPAuth = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30, enforceAppCheck: true})
  .https.onCall(initiateKEPAuthHandler);

export const exchangeKEPCode = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30, enforceAppCheck: true})
  .https.onCall(exchangeKEPCodeHandler);

export const getKEPToken = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30, enforceAppCheck: true})
  .https.onCall(getKEPTokenHandler);

export const scanDocument = functions
  .runWith({maxInstances: 10, timeoutSeconds: 60, memory: '512MB', enforceAppCheck: true})
  .https.onCall(scanDocumentHandler);

// ---------------------------------------------------------------------------
// Storage triggers
// ---------------------------------------------------------------------------
export const onDocumentUpload = functions
  .runWith({maxInstances: 10, timeoutSeconds: 60, memory: '512MB'})
  .storage.object()
  .onFinalize(onDocumentUploadHandler);
