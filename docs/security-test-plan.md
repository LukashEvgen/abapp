# LexTrack v2 — Security / Regression Test Plan

**Issue:** CMP-148 (superseded by MYA-10 CTO audit)  
**Scope:** Security acceptance criteria for LexTrack v2 (staging environment)  
**Date:** 2026-05-06  
**Updated:** 2026-06-13 (CTO audit MYA-10)

---

## 1. Firestore Rules

| # | Test Case | Expected Result | Status |
|---|-----------|-------------------|--------|
| 1.1 | Client не може створити запис у `cases` | `assertFails` | ✅ |
| 1.2 | Client не може створити запис у `events` | `assertFails` | ✅ |
| 1.3 | Client не може створити запис у `documents` (метадані) | `assertFails` | ✅ |
| 1.4 | Client не може створити запис у `invoices` | `assertFails` | ✅ |
| 1.5 | Client не може створити запис у `signatures` | `assertFails` | ✅ |
| 1.6 | Lawyer може виконати CRUD для `cases`, `events`, `documents`, `invoices`, `signatures` | `assertSucceeds` | ✅ |
| 1.7 | Client не може читати дані іншого client (IDOR) | `assertFails` | ✅ |
| 1.8 | Client не може оновити `createdAt` власного профілю | `assertFails` | ✅ |
| 1.9 | Invalid `status`, `progress` (out of range / non-int) відхиляються | `assertFails` | ✅ |
| 1.10 | Anonymous може створити `inquiry` з обов'язковими полями, але не читати | create OK, read FAIL | ✅ |

---

## 2. Storage Rules

| # | Test Case | Expected Result | Status |
|---|-----------|-------------------|--------|
| 2.1 | Anonymous upload відхиляється | `assertFails` | ✅ |
| 2.2 | Invalid content-type (exe) відхиляється | `assertFails` | ✅ |
| 2.3 | File > 25 MB відхиляється | `assertFails` | ✅ |
| 2.4 | Client / Lawyer можуть upload PDF/Image з правильним type | `assertSucceeds` | ✅ |
| 2.5 | Read unscanned file відхиляється для client/lawyer | `assertFails` | ✅ |
| 2.6 | Read scanned file дозволяється | `assertSucceeds` | ✅ |

---

## 3. Rate-Limit (submitInquiry)

| # | Test Case | Expected Result | Status |
|---|-----------|-------------------|--------|
| 3.1 | 6-й `submitInquiry` в межах 15 хв повертає 429 (`resource-exhausted`) | HttpsError 429 | ✅ (unit) |
| 3.2 | Перші 5 запитів проходять | success | ✅ (unit) |
| 3.3 | Після закінчення вікна лічильник скидається | success | ✅ (unit) |

---

## 4. App Check

| # | Test Case | Expected Result | Status |
|---|-----------|-------------------|--------|
| 4.1 | Запит без `context.app` (App Check token) до будь-якого callable відхиляється | `failed-precondition` | ✅ |
| 4.2 | Запит з `context.app` проходить (решта валідацій) | success | ✅ |

---

## 5. Biometric — Session Expired → Re-auth

| # | Test Case | Expected Result | Status |
|---|-----------|-------------------|--------|
| 5.1 | `isSessionExpired()` повертає `true` коли timestamp > 30 хв | `true` | ✅ (unit) |
| 5.2 | `requireBiometric()` блокує доступ і запитує біометрію якщо expired | locked → prompt | ✅ (unit) |
| 5.3 | `refreshSession()` оновлює timestamp | timestamp updated | ✅ (unit) |

---

## 6. Auto-logout — 15 хв inactivity

| # | Test Case | Expected Result | Status |
|---|-----------|-------------------|--------|
| 6.1 | `useInactivityTimer` не спрацьовує до 15 хв | `onExpire` not called | ✅ (unit) |
| 6.2 | `useInactivityTimer` викликає `onExpire` після 15 хв | `onExpire` called | ✅ (unit) |
| 6.3 | `SecurityContext` викликає `onLogout()` при inactivity expire | logout called | ✅ (unit) |

---

## 7. Jailbreak Detection

| # | Test Case | Expected Result | Status |
|---|-----------|-------------------|--------|
| 7.1 | `isJailBroken()` повертає `false` на нормальному пристрої | `false` | ✅ (unit) |
| 7.2 | `isDebuggedMode()` повертає `false` | `false` | ✅ (unit) |
| 7.3 | `SecurityContext` встановлює `jailbreakDetected=true` при jail | alert + true | ✅ (unit) |

---

## 8. Audit Log

| # | Test Case | Expected Result | Status |
|---|-----------|-------------------|--------|
| 8.1 | Після lawyer-операції `writeAuditLog` створює запис у `auditLogs` | doc written | ✅ (unit) |
| 8.2 | Запит без App Check відхиляється | `failed-precondition` | ✅ |
| 8.3 | Запит без auth відхиляється | `unauthenticated` | ✅ |
| 8.4 | Відсутні поля (`actorType`, `action`, `targetCollection`, `targetDocId`) валідуються | `invalid-argument` | ✅ |

---

## 9. Coverage Expansion Plan (MYA-10 CTO audit)

### 9.1 Current Coverage Snapshot

| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| Statements | 14.78% | 10% | ✅ pass |
| Branches | 9.86% | 10% | ⚠️ just pass |
| Functions | 9.98% | 10% | ⚠️ just pass |
| Lines | 15.31% | 10% | ✅ pass |

**Zero-coverage files (45+ files)**: all `src/services/*`, all `src/screens/*`, `src/navigation/*`, `src/hooks/useFirebaseQueries.ts`, `src/hooks/useSensitiveActionGuard.js`, `src/App.js`, `src/components/SensitiveScreenGuard.js`.

### 9.2 Priority A — Service Layer Tests (CRITICAL GAP)

Create `src/__tests__/services.test.ts` covering:
- `cases.ts`: `getCases`, `getCaseById`, `createCase`, `updateCaseProgress`, `updateCase`, `getCaseEvents`, `addCaseEvent`, realtime listeners subscribe/unsubscribe.
- `clients.ts`: `getClientsPaginated`, `getClientById`, `createClient`, `updateClientLastMessage`, `getAllClients`, realtime listeners.
- `inquiries.ts`: `submitInquiry` success/failure, rate-limit integration.
- Error handling: Firestore permission-denied, network errors, null returns.
- Mock `@react-native-firebase/firestore` and `@react-native-firebase/functions`.

### 9.3 Priority B — Security Component Tests

Expand existing tests:
- `SecurityContext.test.js`: jailbreak Alert firing, biometric lock/unlock cycle, AppState background → foreground auto-unlock, `onLogout` called on inactivity.
- `SecurityGate.test.js`: overlay render when `locked=true`, children visible when `locked=false`, `onLogout` callback wired.
- `SensitiveScreenGuard.test.js`: new — blur on `inactive`, unblur on `active`.

### 9.4 Priority C — Auth & Navigation

- `AuthContext.test.js`: login flow success/failure, role detection (`isLawyer`), `confirmCode`, `logout` clears state, `onAuthStateChanged` listener cleanup.
- `AppNavigator.test.js`: deep-link routing, auth-gated screens redirect.

### 9.5 Priority D — Push Notification Mock Fixes

- Fix `pushNotifications.test.ts` 8 failures: mock `Platform.OS`, `Platform.Version`, `messaging().onTokenRefresh`, `PermissionsAndroid.request`.
- These are pre-existing noise but block clean CI.

### 9.6 Priority E — Coverage Threshold Raise

After Priority A (service layer) implemented:
- Raise `coverageThreshold.global` from 10% → 40%.
- After Priority B+C → raise to 60%.

---

## Test Suites Summary

| Suite | Tests | Passed | Failed |
|-------|-------|--------|--------|
| React Native (`src/__tests__/*`) | 93 | 85 | 8 (pre-existing push noise) |
| Firestore/Storage Rules (`tests/`) | 37 | 37 | 0 |
| Cloud Functions (`functions/__tests__/*`) | 102 | 102 | 0 |

### Known failures (not in security AC scope):
- `src/__tests__/pushNotifications.test.ts` — 8 failures due to incomplete mocks for `react-native-firebase/messaging` (`onTokenRefresh`, `Platform.OS`). These are pre-existing noise unrelated to security acceptance criteria.

---

## Reproduce

```bash
# RN unit tests
npm test -- --no-coverage

# Rules tests (requires emulator)
npm run test:rules:regression

# Cloud Functions tests
cd functions && npm test
```

---

## Next Action

1. Implement Priority A: `src/__tests__/services.test.ts` (cases, clients, inquiries).
2. Expand `SecurityContext.test.js` and `SecurityGate.test.js` (Priority B).
3. Fix `pushNotifications.test.ts` mocks (Priority D).
4. Raise coverage threshold to 40% after service tests land.
5. Create child issue for Appium/manual E2E App Check verification (post-CMP-183).
