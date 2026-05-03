const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} = require('firebase/firestore');
const {ref, uploadBytes} = require('firebase/storage');
const fs = require('fs');

const PROJECT_ID = 'lextrack-test';
const FIRESTORE_RULES = fs.readFileSync('../firestore.rules', 'utf8');
const STORAGE_RULES = fs.readFileSync('../storage.rules', 'utf8');

const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8082';
const [firestoreHost, firestorePort] = FIRESTORE_HOST.split(':');
const STORAGE_HOST =
  process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9201';
const [storageHost, storagePort] = STORAGE_HOST.split(':');

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: FIRESTORE_RULES,
      host: firestoreHost,
      port: Number(firestorePort),
    },
    storage: {
      rules: STORAGE_RULES,
      host: storageHost,
      port: Number(storagePort),
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

function lawyerCtx(uid = 'lawyer_1') {
  return testEnv.authenticatedContext(uid, {email: 'lawyer@example.com'});
}

function clientCtx(uid = 'client_1') {
  return testEnv.authenticatedContext(uid, {email: 'client@example.com'});
}

function anonCtx() {
  return testEnv.unauthenticatedContext();
}

async function seedLawyer(uid) {
  const admin = testEnv.authenticatedContext('admin_seed');
  await setDoc(doc(admin.firestore(), 'lawyers', uid), {name: 'Lawyer'});
  await admin.firestore().terminate();
}

// ---------------------------------------------------------------------------
// Firestore rules tests
// ---------------------------------------------------------------------------

describe('Firestore rules', () => {
  describe('clients/{clientId}', () => {
    it('allows lawyer to read any client', async () => {
      await seedLawyer('lawyer_1');
      const ctx = lawyerCtx('lawyer_1');
      await assertSucceeds(getDoc(doc(ctx.firestore(), 'clients', 'client_1')));
    });

    it('allows client to read own record', async () => {
      const ctx = clientCtx('client_1');
      await assertSucceeds(getDoc(doc(ctx.firestore(), 'clients', 'client_1')));
    });

    it('denies client from reading another client', async () => {
      const ctx = clientCtx('client_1');
      await assertFails(getDoc(doc(ctx.firestore(), 'clients', 'client_2')));
    });

    it('allows lawyer to create client with required fields', async () => {
      await seedLawyer('lawyer_1');
      const ctx = lawyerCtx('lawyer_1');
      await assertSucceeds(
        setDoc(doc(ctx.firestore(), 'clients', 'new_client'), {
          name: 'Іван',
          phone: '+380991234567',
          createdAt: new Date(),
        }),
      );
    });

    it('denies client from creating a client', async () => {
      const ctx = clientCtx('client_1');
      await assertFails(
        setDoc(doc(ctx.firestore(), 'clients', 'client_2'), {
          name: 'Петро',
          phone: '+380991234568',
        }),
      );
    });

    it('denies create without required fields', async () => {
      await seedLawyer('lawyer_1');
      const ctx = lawyerCtx('lawyer_1');
      await assertFails(
        setDoc(doc(ctx.firestore(), 'clients', 'bad_client'), {
          name: 'NoPhone',
        }),
      );
    });

    it('allows client to update own name/phone', async () => {
      const ctx = clientCtx('client_1');
      await setDoc(doc(ctx.firestore(), 'clients', 'client_1'), {
        name: 'Іван',
        phone: '+380991234567',
      });
      await assertSucceeds(
        updateDoc(doc(ctx.firestore(), 'clients', 'client_1'), {
          name: 'Іван Оновлений',
          updatedAt: new Date(),
        }),
      );
    });

    it('denies client update of createdAt', async () => {
      const ctx = clientCtx('client_1');
      await setDoc(doc(ctx.firestore(), 'clients', 'client_1'), {
        name: 'Іван',
        phone: '+380991234567',
      });
      await assertFails(
        updateDoc(doc(ctx.firestore(), 'clients', 'client_1'), {
          createdAt: new Date(),
        }),
      );
    });
  });

  describe('clients/{clientId}/cases/{caseId}', () => {
    it('allows lawyer CRUD', async () => {
      await seedLawyer('lawyer_1');
      const ctx = lawyerCtx('lawyer_1');
      const caseRef = doc(
        ctx.firestore(),
        'clients',
        'client_1',
        'cases',
        'case_1',
      );
      await assertSucceeds(
        setDoc(caseRef, {
          title: 'Справка',
          status: 'Розглядається',
          progress: 0,
          createdAt: new Date(),
        }),
      );
      await assertSucceeds(getDoc(caseRef));
      await assertSucceeds(updateDoc(caseRef, {progress: 50}));
      await assertSucceeds(deleteDoc(caseRef));
    });

    it('allows client read but not write', async () => {
      const ctx = clientCtx('client_1');
      const caseRef = doc(
        ctx.firestore(),
        'clients',
        'client_1',
        'cases',
        'case_1',
      );
      await assertSucceeds(getDoc(caseRef));
      await assertFails(setDoc(caseRef, {title: 'Bad'}));
    });

    it('denies invalid case status', async () => {
      await seedLawyer('lawyer_1');
      const ctx = lawyerCtx('lawyer_1');
      const caseRef = doc(
        ctx.firestore(),
        'clients',
        'client_1',
        'cases',
        'case_1',
      );
      await assertFails(
        setDoc(caseRef, {
          title: 'Справка',
          status: 'invalid_status',
          progress: 0,
        }),
      );
    });

    it('denies progress outside 0–100', async () => {
      await seedLawyer('lawyer_1');
      const ctx = lawyerCtx('lawyer_1');
      const caseRef = doc(
        ctx.firestore(),
        'clients',
        'client_1',
        'cases',
        'case_1',
      );
      await assertFails(
        setDoc(caseRef, {
          title: 'Справка',
          status: 'Розглядається',
          progress: 101,
        }),
      );
    });

    it('denies non-int progress', async () => {
      await seedLawyer('lawyer_1');
      const ctx = lawyerCtx('lawyer_1');
      const caseRef = doc(
        ctx.firestore(),
        'clients',
        'client_1',
        'cases',
        'case_1',
      );
      await assertFails(
        setDoc(caseRef, {
          title: 'Справка',
          status: 'Розглядається',
          progress: 50.5,
        }),
      );
    });
  });

  describe('inquiries', () => {
    it('allows anonymous create with valid fields', async () => {
      const ctx = anonCtx();
      await assertSucceeds(
        setDoc(doc(ctx.firestore(), 'inquiries', 'inq_1'), {
          name: 'Олег',
          phone: '+380991234567',
          text: 'Питання',
          status: 'new',
          createdAt: new Date(),
        }),
      );
    });

    it('denies anonymous create without required fields', async () => {
      const ctx = anonCtx();
      await assertFails(
        setDoc(doc(ctx.firestore(), 'inquiries', 'inq_1'), {
          name: 'Олег',
          status: 'new',
        }),
      );
    });

    it('denies anonymous read', async () => {
      const ctx = anonCtx();
      await assertFails(getDoc(doc(ctx.firestore(), 'inquiries', 'inq_1')));
    });

    it('allows lawyer read and update', async () => {
      await seedLawyer('lawyer_1');
      const ctx = lawyerCtx('lawyer_1');
      const inqRef = doc(ctx.firestore(), 'inquiries', 'inq_1');
      await assertSucceeds(getDoc(inqRef));
      await assertSucceeds(updateDoc(inqRef, {status: 'in_progress'}));
    });

    it('denies lawyer update to invalid status', async () => {
      await seedLawyer('lawyer_1');
      const ctx = lawyerCtx('lawyer_1');
      const inqRef = doc(ctx.firestore(), 'inquiries', 'inq_1');
      await assertFails(updateDoc(inqRef, {status: 'hacked'}));
    });
  });

  describe('lawyers', () => {
    it('allows lawyer read own record', async () => {
      await seedLawyer('lawyer_1');
      const ctx = lawyerCtx('lawyer_1');
      await assertSucceeds(getDoc(doc(ctx.firestore(), 'lawyers', 'lawyer_1')));
    });

    it('denies non-lawyer read', async () => {
      const ctx = clientCtx('client_1');
      await assertFails(getDoc(doc(ctx.firestore(), 'lawyers', 'lawyer_1')));
    });

    it('denies all writes', async () => {
      await seedLawyer('lawyer_1');
      const ctx = lawyerCtx('lawyer_1');
      await assertFails(
        setDoc(doc(ctx.firestore(), 'lawyers', 'lawyer_1'), {name: 'Hack'}),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Storage rules tests
// ---------------------------------------------------------------------------

describe('Storage rules', () => {
  describe('clients/{clientId}/cases/{caseId}/documents/{file}', () => {
    it('allows client to upload valid file', async () => {
      const ctx = clientCtx('client_1');
      const sRef = ref(
        ctx.storage(),
        'clients/client_1/cases/case_1/documents/test.pdf',
      );
      const blob = new Blob(['pdf content'], {type: 'application/pdf'});
      await assertSucceeds(
        uploadBytes(sRef, blob, {contentType: 'application/pdf'}),
      );
    });

    it('allows lawyer to upload valid file', async () => {
      await seedLawyer('lawyer_1');
      const ctx = lawyerCtx('lawyer_1');
      const sRef = ref(
        ctx.storage(),
        'clients/client_1/cases/case_1/documents/test.pdf',
      );
      const blob = new Blob(['pdf content'], {type: 'application/pdf'});
      await assertSucceeds(
        uploadBytes(sRef, blob, {contentType: 'application/pdf'}),
      );
    });

    it('denies anonymous upload', async () => {
      const ctx = anonCtx();
      const sRef = ref(
        ctx.storage(),
        'clients/client_1/cases/case_1/documents/test.pdf',
      );
      const blob = new Blob(['pdf content'], {type: 'application/pdf'});
      await assertFails(
        uploadBytes(sRef, blob, {contentType: 'application/pdf'}),
      );
    });

    it('denies invalid content type', async () => {
      const ctx = clientCtx('client_1');
      const sRef = ref(
        ctx.storage(),
        'clients/client_1/cases/case_1/documents/test.exe',
      );
      const blob = new Blob(['exe content'], {
        type: 'application/x-msdownload',
      });
      await assertFails(
        uploadBytes(sRef, blob, {contentType: 'application/x-msdownload'}),
      );
    });
  });
});
