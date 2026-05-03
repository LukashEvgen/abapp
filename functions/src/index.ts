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

// ---------------------------------------------------------------------------
// Summaries callable function
// ---------------------------------------------------------------------------
export const getAdminMessagesSummary = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30, enforceAppCheck: true})
  .https.onCall(async (_data, _context) => {
    const snapshot = await admin
      .firestore()
      .collection('clients')
      .orderBy('lastMessageAt', 'desc')
      .get();
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        clientId: d.id,
        name: data.name || 'Без імені',
        lastMessage: data.lastMessage || '',
        unreadCount: data.unreadCount || 0,
      };
    });
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
