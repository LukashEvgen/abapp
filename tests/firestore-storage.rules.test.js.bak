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
  const {ref, uploadBytes, getDownloadURL} = require('firebase/storage');
const fs = require('fs');

const PROJECT_ID = 'lextrack-test';
const FIRESTORE_RULES = fs.readFileSync('./firestore.rules', 'utf8');
const STORAGE_RULES = fs.readFileSync('./storage.rules', 'utf8');

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
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'lawyers', uid), {name: 'Lawyer'});
  });
}

async function seedClient(uid) {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'clients', uid), {
      name: 'Ivan',
      phone: '+380991234567',
    });
  });
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
          name: 'Ivan',
          phone: '+380991234567',
          createdAt: new Date(),
        }),
      );
    });

    it('denies client from creating a client', async () => {
      const ctx = clientCtx('client_1');
      await assertFails(
        setDoc(doc(ctx.firestore(), 'clients', 'client_2'), {
          name: 'Petro',
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
      await seedClient('client_1');
      const ctx = clientCtx('client_1');
      await assertSucceeds(
        updateDoc(doc(ctx.firestore(), 'clients', 'client_1'), {
          name: 'Ivan Updated',
          updatedAt: new Date(),
        }),
      );
    });

    it('denies client update of createdAt', async () => {
      await seedClient('client_1');
      const ctx = clientCtx('client_1');
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
          title: 'Spravka',
          status: 'in_progress',
          progress: 0,
          createdAt: new Date(),
        }),
      );
      await assertSucceeds(getDoc(caseRef));
      await assertSucceeds(updateDoc(caseRef, {progress: 50}));
      await assertSucceeds(deleteDoc(caseRef));
    });

    it('allows lawyer update without touching status', async () => {
      await seedLawyer('lawyer_1');
      await testEnv.withSecurityRulesDisabled(async ctx => {
        await setDoc(
          doc(ctx.firestore(), 'clients', 'client_1', 'cases', 'case_1'),
          {title: 'Spravka', status: 'in_progress', progress: 0},
        );
      });
      const ctx = lawyerCtx('lawyer_1');
      const caseRef = doc(
        ctx.firestore(),
        'clients',
        'client_1',
        'cases',
        'case_1',
      );
      await assertSucceeds(updateDoc(caseRef, {title: 'Updated title'}));
      await assertSucceeds(updateDoc(caseRef, {progress: 42}));
    });

    it('allows client read but not write', async () => {
      await seedClient('client_1');
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
          title: 'Spravka',
          status: 'invalid_status',
          progress: 0,
        }),
      );
    });

    it('denies progress outside 0-100', async () => {
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
          title: 'Spravka',
          status: 'Rozglyadaye',
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
          title: 'Spravka',
          status: 'Rozglyadaye',
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
          name: 'Oleg',
          phone: '+380991234567',
          text: 'Pytannya',
          status: 'new',
          createdAt: new Date(),
        }),
      );
    });

    it('denies anonymous create without required fields', async () => {
      const ctx = anonCtx();
      await assertFails(
        setDoc(doc(ctx.firestore(), 'inquiries', 'inq_1'), {
          name: 'Oleg',
          status: 'new',
        }),
      );
    });

    it('denies anonymous read', async () => {
      const ctx = anonCtx();
      await assertFails(getDoc(doc(ctx.firestore(), 'inquiries', 'inq_1')));
    });

    it('allows lawyer read and update', async () => {
      await testEnv.withSecurityRulesDisabled(async ctx => {
        await setDoc(doc(ctx.firestore(), 'inquiries', 'inq_1'), {
          name: 'Oleg',
          phone: '+380991234567',
          text: 'Pytannya',
          status: 'new',
        });
      });
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
      await seedLawyer('lawyer_1');
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
      const data = new Uint8Array(Buffer.from('pdf content'));
      await assertSucceeds(
        uploadBytes(sRef, data, {contentType: 'application/pdf'}),
      );
    });

    it('allows lawyer to upload valid file', async () => {
      await seedLawyer('lawyer_1');
      const ctx = lawyerCtx('lawyer_1');
      const sRef = ref(
        ctx.storage(),
        'clients/client_1/cases/case_1/documents/test.pdf',
      );
      const data = new Uint8Array(Buffer.from('pdf content'));
      await assertSucceeds(
        uploadBytes(sRef, data, {contentType: 'application/pdf'}),
      );
    });

    it('denies anonymous upload', async () => {
      const ctx = anonCtx();
      const sRef = ref(
        ctx.storage(),
        'clients/client_1/cases/case_1/documents/test.pdf',
      );
      const data = new Uint8Array(Buffer.from('pdf content'));
      await assertFails(
        uploadBytes(sRef, data, {contentType: 'application/pdf'}),
      );
    });

    it('denies invalid content type', async () => {
      const ctx = clientCtx('client_1');
      const sRef = ref(
        ctx.storage(),
        'clients/client_1/cases/case_1/documents/test.exe',
      );
      const data = new Uint8Array(Buffer.from('exe content'));
      await assertFails(
        uploadBytes(sRef, data, {contentType: 'application/x-msdownload'}),
      );
    });

    it('denies read for unscanned file', async () => {
      const ctx = clientCtx('client_1');
      const sRef = ref(
        ctx.storage(),
        'clients/client_1/cases/case_1/documents/test.pdf',
      );
      const data = new Uint8Array(Buffer.from('pdf content'));
      await assertSucceeds(
        uploadBytes(sRef, data, {contentType: 'application/pdf'}),
      );
      await assertFails(getDownloadURL(sRef));
    });
  });
});
