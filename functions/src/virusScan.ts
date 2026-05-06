import * as admin from 'firebase-admin';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;

import * as crypto from 'crypto';

export type ScanStatus = 'pending' | 'clean' | 'infected';

export interface ScanResult {
  scanned: boolean;
  scanStatus: ScanStatus;
  sha256: string;
  malicious: number;
}

export async function hashFromBuffer(buf: Buffer): Promise<string> {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function getVirusTotalReport(
  sha256: string,
): Promise<{scanned: boolean; malicious: number} | null> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    console.warn('VIRUSTOTAL_API_KEY not set, skipping real scan');
    return null;
  }
  try {
    const response = await fetch(
      `https://www.virustotal.com/api/v3/files/${sha256}`,
      {
        headers: {'x-apikey': apiKey},
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

export async function scanFile(
  buffer: Buffer,
  existingSha256?: string,
): Promise<ScanResult> {
  let fileHash = existingSha256 || '';
  if (!fileHash) {
    fileHash = await hashFromBuffer(buffer);
  }

  let scanned = false;
  let scanStatus: ScanStatus = 'pending';
  let malicious = 0;

  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (apiKey && fileHash) {
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

  return {
    scanned,
    scanStatus,
    sha256: fileHash,
    malicious,
  };
}

export async function updateDocumentScanInFirestore(
  clientId: string,
  caseId: string,
  documentId: string,
  result: ScanResult,
  mimeType?: string,
): Promise<void> {
  const docRef = admin
    .firestore()
    .collection('clients')
    .doc(clientId)
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .doc(documentId);

  await docRef.update({
    scanned: result.scanned,
    scanStatus: result.scanStatus,
    sha256: result.sha256 || admin.firestore.FieldValue.delete(),
    mimeType: mimeType || admin.firestore.FieldValue.delete(),
    scannedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function updateFileMetadata(
  storagePath: string,
  result: ScanResult,
): Promise<void> {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);
    await file.setMetadata({
      metadata: {
        scanned: result.scanned ? 'true' : 'false',
        scanStatus: result.scanStatus,
      },
    });
  } catch (err) {
    console.error('Failed to update storage metadata', err);
  }
}
