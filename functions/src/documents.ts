import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  ScanStatus,
  scanFile,
  updateDocumentScanInFirestore,
  updateFileMetadata,
} from './virusScan';
import {assertAppCheck} from './registry/common';

interface ScanDocumentData {
  clientId: string;
  caseId: string;
  documentId: string;
  storagePath: string;
  sha256?: string;
  mimeType?: string;
}

export {ScanStatus};

export const scanDocumentHandler = async (
  data: ScanDocumentData,
  context: functions.https.CallableContext,
): Promise<{scanned: boolean; scanStatus: ScanStatus; documentId: string}> => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated.',
    );
  }

  assertAppCheck(context);

  const {clientId, caseId, documentId, storagePath, sha256, mimeType} = data;

  if (!clientId || !caseId || !documentId || !storagePath) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields.',
    );
  }

  const isLawyer = await admin
    .firestore()
    .collection('lawyers')
    .doc(context.auth.uid)
    .get()
    .then(s => s.exists);

  if (!isLawyer && context.auth.uid !== clientId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Not authorized for this document.',
    );
  }

  let buffer: Buffer | undefined;
  let fileHash = sha256 || '';
  if (!fileHash) {
    try {
      const bucket = admin.storage().bucket();
      const file = bucket.file(storagePath);
      const [buf] = await file.download();
      buffer = buf;
    } catch (err) {
      console.error('Failed to download file for hashing', err);
    }
  }

  const result = await scanFile(buffer || Buffer.alloc(0), fileHash);

  await updateDocumentScanInFirestore(clientId, caseId, documentId, result, mimeType);
  await updateFileMetadata(storagePath, result);

  console.log(
    `Document ${documentId} scan result: scanStatus=${result.scanStatus} scanned=${result.scanned} malicious=${result.malicious}`,
  );

  return {
    scanned: result.scanned,
    scanStatus: result.scanStatus,
    documentId,
  };
};
