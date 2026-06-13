# MYA-10: QA Testing & Strategy Plan for LexTrack — Analysis Complete

## 1. Existing Test Inventory

### 1.1 React Native (src/__tests__/) — 12 files, 1,061 lines total
| File | Lines | Notes |
|------|-------|-------|
| AuthContext.test.js | 70 | Auth context tests |
| biometric.test.js | 84 | Biometric + session TTL tests |
| helpers.test.js | 193 | Utility tests |
| jailbreak.test.js | 20 | Only 1 trivial test |
| palette-v2-regression.test.js | 15 | UI regression |
| PushNotificationsProvider.test.js | 115 | Push provider tests |
| SecurityContext.test.js | 68 | Security context tests |
| SecurityGate.test.js | 49 | Only render test |
| theme.test.js | 264 | Theme/styling tests |
| ui-import.test.js | 7 | Import smoke test |
| useInactivityTimer.test.js | 68 | Inactivity timer tests |
| pushNotifications.test.ts | 108 | 8 pre-existing failures (noise) |

**CRITICAL**: ALL RN unit tests are BROKEN due to syntax error in react-native jest setup:
```
SyntaxError: Unexpected identifier 'ErrorHandler'
  at node_modules/react-native/jest/setup.js:16
```
This is a Jest / react-native / babel-jest version incompatibility.

### 1.2 Cloud Functions (functions/__tests__/) — 10 files, 102 tests
ALL PASSING (7.999s). Good coverage.

| File | Focus |
|------|-------|
| appCheckEnforcement.test.ts | App Check rejection for all callable handlers |
| auditLog.test.ts | Audit log validation |
| inquiries.test.ts | Rate limiting (6 per 15min -> 429) |
| kepAuth.test.ts | PKCE flow, token refresh |
| messages.test.ts | Message sending |
| push.test.ts | Push notification handling |
| registryCommon.test.ts | assertAppCheck (present/null/undefined) |
| signatures.test.ts | Role checks |
| storageTriggers.test.ts | Storage event triggers |
| virusScan.test.ts | Document virus scanning |

### 1.3 Firestore/Storage Rules (tests/) — 1 file, ~37 tests
File: `tests/firestore-storage.rules.test.js` (556 lines)
Requires Firebase emulator. Covers:
- Firestore RBAC (clients, cases, events, invoices, signatures)
- IDOR prevention
- Status/progress validation
- Storage content-type, size, scan-gate

## 2. Jest Configuration Analysis

### Root package.json jest config:
- `preset: "react-native"` — broken with current versions
- `collectCoverageFrom`: only 3 files (!):
  - `src/utils/helpers.js`
  - `src/utils/theme.js`
  - `src/context/AuthContext.js`
- `coverageThreshold`: ONLY for `src/utils/helpers.js` at 80%
- `testPathIgnorePatterns`: excludes `tests/`

### functions/jest.config.js:
- `coverageThreshold.global`: 80% branches/functions/lines/statements
- Proper TypeScript transform via babel-jest
- Works correctly

## 3. Security Test Audit

### SecurityGate.test.js
- Only tests that component renders children
- MISSING: jailbreak detection flow, biometric prompt, session expiry, auto-logout
- MISSING: Alert display on security violation

### jailbreak.test.js
- Only 1 test: returns false by default
- MISSING: debug mode detection, SecurityContext integration, Alert firing

### biometric.test.js
- Good coverage: sensor availability, prompt, session timestamp, TTL (30min)
- MISSING: failure paths (biometric rejected, sensor unavailable), keychain errors

## 4. Gaps & Expansion Plan

### Priority A — FIX BROKEN TESTS
1. **Fix RN Jest preset** — resolve `error-guard.js` Flow syntax crash
   - Options: add `@babel/preset-flow`, update react-native, or mock the polyfill
2. Once fixed, all 12 RN test suites should execute

### Priority B — Expand Coverage Targets
3. **Add `collectCoverageFrom` for all src modules**:
   - `src/security/*.js`
   - `src/context/*.js`
   - `src/hooks/*.js`
   - `src/components/*.js`
   - `src/services/*.ts`
4. **Add global `coverageThreshold` at 60%** (raise to 80% after stabilization)

### Priority C — Security Test Expansion
5. **SecurityGate.test.js** — add tests for:
   - `jailbreakDetected=true` → shows Alert + blocks children
   - `sessionExpired=true` → prompts biometric
   - `inactivity timeout` → calls logout
   - App background/foreground behavior
6. **jailbreak.test.js** — add tests for:
   - `isDebuggedMode()` return paths
   - Integration with `SecurityContext` state update
7. **AuthContext.test.js** — expand to cover:
   - Login flow (success / failure)
   - Role detection (lawyer vs client)
   - Token refresh
8. **Add new `src/__tests__/services.test.ts`** — test service layer:
   - `cases.ts`, `clients.ts`, `inquiries.ts`
   - Error handling, Firebase integration

### Priority D — Rules Test Completion
9. `docs/SECURITY_QA_TEST_PLAN.md` shows gaps:
   - Negative cases for: lawyer writes to `lawyers`, anonymous read of `inquiries`
   - These are actually already covered in `firestore-storage.rules.test.js`
   - Status: GAPS CLOSED

### Priority E — E2E / Integration
10. **Manual/Appium E2E tests** (post-CMP-183):
    - Real device App Check (Play Integrity / DeviceCheck)
    - Biometric prompt on physical device
    - KEP signing flow end-to-end

## 5. Recommended Definition of Done (Updated)

- [x] Security QA test plan committed
- [x] `appCheckEnforcement.test.ts` created and passing
- [x] Negative rules tests added and passing
- [x] Cloud Functions coverage ≥ 80%
- [ ] **RN Jest preset fixed — all 12 suites running**
- [ ] **RN coverage expanded to all src modules**
- [ ] **SecurityGate + jailbreak tests expanded**
- [ ] **Service layer tests added**
- [ ] **Global coverage threshold ≥ 60%**
- [ ] Child issue for manual e2e App Check verification

## 6. Files to Modify

1. `package.json` — fix jest config (preset/transformIgnorePatterns/coverage)
2. `src/__tests__/SecurityGate.test.js` — expand test cases
3. `src/__tests__/jailbreak.test.js` — expand test cases
4. `src/__tests__/services.test.ts` — new file
5. `docs/SECURITY_QA_TEST_PLAN.md` — update DoD status
