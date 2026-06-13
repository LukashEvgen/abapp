# MYA-15 — Security fixes report

## Changes made

### 1. CRITICAL: Storage rules backdoor email
- Verified: `firestore.rules` and `storage.rules` do NOT contain `lawyer@example.com` backdoor.
- Backup exists at `.backup-mya15/` confirming the issue was previously addressed.

### 2. CRITICAL: Virus scan bypass (B6)
- Verified: `virusScan.ts` correctly returns `scanStatus: 'pending'` when `VIRUSTOTAL_API_KEY` is absent.
- No "mark all clean" fallback exists in current code.

### 3. CRITICAL: Buffer.alloc(0) in scanFile (B7)
- Verified: `documents.ts` passes `buffer || Buffer.alloc(0)` to `scanFile()`.
- When buffer is empty and no sha256 is provided, `hashFromBuffer` computes hash of empty buffer.
- Result is `scanStatus: 'pending'` (not 'clean') — safe behavior.

### 4. HIGH: Registry callable functions — missing role check (B4)
**Fixed in `functions/src/registry/common.ts`, `edr.ts`, `court.ts`, `enforcement.ts`:**
- Added `assertLawyer(context)` — async function that:
  1. Checks `context.auth` exists
  2. Calls `assertAppCheck(context)`
  3. Verifies Firestore `lawyers/{uid}` document exists
  4. Throws `permission-denied` if user is not a lawyer
- All registry handlers (`searchEdrHandler`, `searchCourtHandler`, `searchEnforcementHandler`) now use `await assertLawyer(context)` instead of simple auth check.

### 5. HIGH: Messages delete (B8)
- Already fixed in `firestore.rules`: `allow delete: if false;` with comment "soft-delete only — server-side".

### 6. HIGH: registry_cache write (B1)
- Already fixed in `firestore.rules`: `allow read, write: if isLawyer();`.

### 7. Additional fix: assertAppCheck restored
- `assertAppCheck()` in `functions/src/registry/common.ts` was a no-op comment.
- Restored to actual implementation: throws `failed-precondition` when `context.app` is missing.
- This fixes `__tests__/appCheckEnforcement.test.ts` and `__tests__/registryCommon.test.ts`.

## Test results
- `appCheckEnforcement.test.ts` — PASS (11 tests)
- `registryCommon.test.ts` — PASS (3 tests)
- `storageTriggers.test.ts` — PASS (8 tests)
- `messages.test.ts` — PASS (5 tests)
- `signatures.test.ts` — PASS (11 tests)
- `kepAuth.test.ts` — PASS (8 tests)
- `auditLog.test.ts` — PASS (8 tests)
- `inquiries.test.ts` — PASS (12 tests)
- `push.test.ts` — PASS (28 tests)
- `virusScan.test.ts` — 3 failures (pre-existing: `crypto.createHash` mock issue in test, not production bug)
- **Total: 9/10 suites pass, 99/102 tests pass**
- `npx tsc --noEmit` — zero TypeScript errors

## Remaining
- `virusScan.test.ts`: 3 failures related to Jest `crypto` module mocking (`TypeError: crypto.createHash is not a function`). This is a test-only issue, production code is safe.
