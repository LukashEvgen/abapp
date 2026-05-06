# QA Security Test Plan — LexTrack v2

> Issue: **CMP-148**  
> Date: 2026-05-06  
> Owner: QA-тестувальник (agent d0477bb8)

---

## 1. Scope

Верифікація захисту на трьох рівнях:
1. **Cloud Functions (callable)** — обов’язковий App Check + auth + role checks.
2. **Firestore Rules** — RBAC, field validation, data ownership.
3. **Storage Rules** — auth, content-type, virus-scan gate (`isScanned`).

Виконується на **emulator/unit** тестах (Firebase App Check не вимагає реального Firebase Console).

---

## 2. Risk Matrix (high-priority threats)

| # | Threat | Mitigation in codebase | How we test |
|---|--------|----------------------|-------------|
| 1 | Anonymous calls to paid/registry APIs | `enforceAppCheck: true` + `assertAppCheck` | Unit: context.app absent → `failed-precondition` |
| 2 | Client impersonates lawyer | Firestore `isLawyer()` + callable auth check | Rules + function unit tests with wrong role |
| 3 | Horizontal IDOR (client reads other client data) | `isOwner(clientId)` | Rules tests: `clientCtx('A')` accesses `clients/B` |
| 4 | Storage upload of executable malware | `isValidContentType()` + `isFileSizeValid()` | Rules: `.exe` upload fails; scan gate blocks read |
| 5 | Tampering case status / progress outside enum | `isValidCaseStatus` / `isValidProgress` | Rules: invalid string / out-of-range int denied |
| 6 | Missing App Check on KEP signing endpoints | `enforceAppCheck: true` on all KEP functions | Unit: verify each handler rejects no-token context |
| 7 | Replay / double-spend of KEP code exchange | `exchanged` flag + Firestore txn | Unit: `already-exists` on second exchange |
| 8 | Unscanned document read bypass | `isScanned()` in Storage rules | Rules: `getDownloadURL` fails without `scanned: true` |

---

## 3. Test Assets

| Asset | Path |
|-------|------|
| Functions tests | `functions/__tests__/*.test.ts` |
| Rules tests | `tests/firestore-storage.rules.test.js` |
| App Check helper | `functions/__tests__/helpers/appCheck.ts` (new) |
| Security plan | `docs/SECURITY_QA_TEST_PLAN.md` (this doc) |

---

## 4. Existing Test Coverage (as of 2026-05-06)

- `registryCommon.test.ts` — 3 tests for `assertAppCheck` (present / null / undefined).
- `kepAuth.test.ts` — auth checks, PKCE flow, token refresh; **no App Check enforced yet**.
- `signatures.test.ts` — role checks; **no App Check enforced yet**.
- `firestore-storage.rules.test.js` — basic CRUD + status/progress validation + scan gate.

**Gaps to close in this heartbeat:**
- Callable handlers do **not** yet call `assertAppCheck` inside business logic (rely only on `runWith({enforceAppCheck: true})`, which is platform-level). We add **negative emulator-style tests** that simulate a request with missing `context.app`.
- Rules tests lack negative cases for: lawyer writes to `lawyers`, anonymous read of `inquiries`, client write to `cases/events`, update of `signatures` by client, invalid `contentType` upload, oversized file.

---

## 5. Execution Plan

### 5.1 Unit tests — Cloud Functions App Check enforcement
- Create `functions/__tests__/appCheckEnforcement.test.ts` that imports each callable handler and asserts `failed-precondition` when `context.app` is absent.
- Handlers covered:
  - `searchEdrHandler`, `searchCourtHandler`, `searchEnforcementHandler`
  - `createSignSessionHandler`, `completeSignSessionHandler`, `signDocumentHandler`
  - `initiateKEPAuthHandler`, `exchangeKEPCodeHandler`, `getKEPTokenHandler`
  - `scanDocumentHandler`
  - `writeAuditLogHandler`

### 5.2 Unit tests — Firestore/Storage negative security
- Extend `tests/firestore-storage.rules.test.js` with cases from section 4 gaps.

### 5.3 Run verification
- `cd functions && npm test` — must pass with threshold ≥ 80 %.
- `npm test -- tests/firestore-storage.rules.test.js` — must pass (requires running emulators).

---

## 6. Definition of Done

- [x] Security QA test plan committed in `docs/SECURITY_QA_TEST_PLAN.md`.
- [ ] `appCheckEnforcement.test.ts` created and passing.
- [ ] Additional negative rules tests added and passing.
- [ ] Coverage for `assertAppCheck` and callable handlers ≥ 80 %.
- [ ] Child issue (or inline comment) created for manual end-to-end App Check verification after CMP-183.

---

## 7. Next Actions After This Heartbeat

1. **CMP-183** завершується → ручне e2e тестування на реальному пристрої з Play Integrity / DeviceCheck.
2. Перевірити debug tokens видалено перед prod-релізом.
3. Підписати Release Checklist (CTO).
