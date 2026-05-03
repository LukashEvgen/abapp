import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {scanFile, updateDocumentScanInFirestore, updateFileMetadata} from './virusScan';

/**
 * storage.onFinalize trigger — автоматично сканує файл на віруси
 * після завантаження в Cloud Storage.
 * Очікує шлях: clients/{clientId}/cases/{caseId}/documents/{fileName}
 */
export const onDocumentUploadHandler = async (object: functions.storage.ObjectMetadata) => {
    const filePath = object.name;
    if (!filePath) {
      console.log('No file path in storage object, skipping.');
      return;
    }

    // Перевіряємо, що файл лежить у expected шляху документів клієнта
    const match = filePath.match(
      /^clients\/([^/]+)\/cases\/([^/]+)\/documents\/(.+)$/,
    );
    if (!match) {
      console.log(`Path ${filePath} does not match document pattern, skipping.`);
      return;
    }

    const [, clientId, caseId] = match;
    console.log(`Scanning upload: ${filePath}`);

    // Шукаємо документ у Firestore за storagePath
    const docsSnapshot = await admin
      .firestore()
      .collection('clients')
      .doc(clientId)
      .collection('cases')
      .doc(caseId)
      .collection('documents')
      .where('storagePath', '==', filePath)
      .limit(1)
      .get();

    if (docsSnapshot.empty) {
      console.warn(`No Firestore document found for storagePath ${filePath}`);
      return;
    }

    const docSnap = docsSnapshot.docs[0];
    const docData = docSnap.data();
    const documentId = docSnap.id;

    // Якщо вже проскановано — пропускаємо (idempotency)
    if (docData.scanStatus === 'clean' || docData.scanStatus === 'infected') {
      console.log(`Document ${documentId} already scanned (${docData.scanStatus}), skipping.`);
      return;
    }

    // Завантажуємо файл для хешування/сканування
    let buffer: Buffer;
    try {
      const bucket = admin.storage().bucket(object.bucket);
      const file = bucket.file(filePath);
      const [buf] = await file.download();
      buffer = buf;
    } catch (err) {
      console.error(`Failed to download file ${filePath} for scan`, err);
      return;
    }

    // Виконуємо сканування
    const result = await scanFile(buffer, docData.sha256);

    // Оновлюємо Firestore
    await updateDocumentScanInFirestore(
      clientId,
      caseId,
      documentId,
      result,
      docData.mimeType,
    );

    // Оновлюємо метадані Storage
    await updateFileMetadata(filePath, result);

    console.log(
      `Document ${documentId} scan result: ${result.scanStatus} (scanned=${result.scanned}, malicious=${result.malicious})`,
    );
  }
