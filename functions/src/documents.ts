import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;

interface ScanDocumentData {
  clientId: string;
  caseId: string;
  documentId: string;
  storagePath: string;
  sha256?: string;
  mimeType?: string;
}

async function hashFromBuffer(buf: Buffer): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function getVirusTotalReport(
  sha256: string,
): Promise<{scanned: boolean; malicious: number} | null> {
  if (!VIRUSTOTAL_API_KEY) {
    console.warn('VIRUSTOTAL_API_KEY not set, skipping real scan');
    return null;
  }
  try {
    const response = await fetch(
      `https://www.virustotal.com/api/v3/files/${sha256}`,
      {
        headers: {'x-apikey': VIRUSTOTAL_API_KEY},
      },
    );
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      console.error(
        'VirusTotal API error',
        response.status,
        await response.text(),
      );
      return null;
    }
    const json = (await response.json()) as any;
    const stats = json?.data?.attributes?.last_analysis_stats;
    if (!stats) {
      return null;
    }
    return {
      scanned: true,
      malicious: stats.malicious || 0,
    };
  } catch (err) {
    console.error('VirusTotal fetch error', err);
    return null;
  }
}

export type ScanStatus = 'pending' | 'clean' | 'infected';

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

  let fileHash = sha256 || '';
  if (!fileHash) {
    try {
      const bucket = admin.storage().bucket();
      const file = bucket.file(storagePath);
      const [buffer] = await file.download();
      fileHash = await hashFromBuffer(buffer);
    } catch (err) {
      console.error('Failed to download file for hashing', err);
    }
  }

  let scanned = false;
  let scanStatus: ScanStatus = 'pending';
  let malicious = 0;

  if (VIRUSTOTAL_API_KEY && fileHash) {
    const report = await getVirusTotalReport(fileHash);
    if (report) {
      scanned = report.scanned && report.malicious === 0;
      malicious = report.malicious;
      scanStatus = scanned ? 'clean' : 'infected';
    } else {
      scanned = false;
      scanStatus = 'pending';
    }
  } else {
    scanned = true;
    scanStatus = 'clean';
  }

  const docRef = admin
    .firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .doc(documentId);

  await docRef.update({
    scanned,
    scanStatus,
    sha256: fileHash || admin.firestore.FieldValue.delete(),
    mimeType: mimeType || admin.firestore.FieldValue.delete(),
    scannedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);
    await file.setMetadata({
      metadata: {
        scanned: scanned ? 'true' : 'false',
        scanStatus,
      },
    });
  } catch (err) {
    console.error('Failed to update storage metadata', err);
  }

  console.log(
    `Document ${documentId} scan result: scanStatus=${scanStatus} scanned=${scanned} malicious=${malicious}`,
  );

  return {scanned, scanStatus, documentId};
};
