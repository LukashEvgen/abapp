const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Enforce App Check on callable functions.
 * Rejects requests where context.app is null (missing or invalid App Check token).
 */
function requireAppCheck(context) {
  if (!context || !context.app) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'App Check token is missing or invalid. Request rejected.'
    );
  }
}

/* ================================================================
   Example: callable function protected by App Check
   ================================================================ */
exports.exampleProtectedCallable = functions.https.onCall((data, context) => {
  requireAppCheck(context);

  // Production logic goes here
  return { success: true, message: 'App Check verified.' };
});

/* ================================================================
   Example: HTTPS onRequest function with App Check enforcement
   ================================================================ */
exports.exampleProtectedRequest = functions.https.onRequest(async (req, res) => {
  // For HTTP functions, App Check token is passed in the
  // X-Firebase-AppCheck header automatically by the client SDK.
  // You can additionally verify it server-side with the Admin SDK
  // if you need stricter guarantees.
  const appCheckToken = req.headers['x-firebase-appcheck'];
  if (!appCheckToken) {
    res.status(401).json({ error: 'App Check token is missing. Request rejected.' });
    return;
  }

  res.json({ status: 'ok', appCheck: 'present' });
});

/* ================================================================
   Existing push-notification trigger example (Firestore onCreate)
   ================================================================ */
exports.notifyClientOnNewInvoice = functions.firestore
  .document('clients/{clientId}/invoices/{invoiceId}')
  .onCreate(async (snap, context) => {
    // Firestore triggers do not use App Check context.app.
    // App Check is enforced at the client→Firestore boundary via Security Rules.
    const invoice = snap.data();
    const clientId = context.params.clientId;

    const clientDoc = await admin
      .firestore()
      .collection('clients')
      .doc(clientId)
      .get();

    const fcmToken = clientDoc.data()?.fcmToken;
    if (!fcmToken) {
      return null;
    }

    const message = {
      token: fcmToken,
      notification: {
        title: 'Новий рахунок',
        body: `Виставлено рахунок: ${invoice.amount || 0} грн`,
      },
      data: {
        clientId,
        invoiceId: context.params.invoiceId,
        type: 'invoice',
      },
    };

    return admin.messaging().send(message);
  });
