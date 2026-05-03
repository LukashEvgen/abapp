# Firebase App Check — Setup Guide for LexTrack

> Target project: **lextrack-80605**  
> Application ID: `com.lextrack` (Android) / `com.lextrack` (iOS)  
> Last updated: 2026-05-03

---

## 1. What is already configured in the codebase

The LexTrack codebase already contains all necessary App Check __client-side__ code:

- `src/services/appCheck.js` — activates the correct provider at runtime (`debug` for `__DEV__`, `playintegrity` / `deviceCheck` for release).
- `ios/LexTrack/AppDelegate.mm` — sets `FIRAppCheckDebugProviderFactory` (DEBUG) or `FIRDeviceCheckProviderFactory` (release).
- `android/app/build.gradle` — includes `com.google.firebase:firebase-appcheck-playintegrity` dependency.
- `functions/index.js` and `functions/src/registry/common.ts` — enforce `context.app != null` on callable functions; `onRequest` functions check the `X-Firebase-AppCheck` header.
- `firestore.rules` — ready for App Check enforcement once the console flag is enabled.

**What is missing:** the **console-side** configuration (Play Integrity API attestation, debug tokens, and optional Firestore/Storage App Check enforcement) must be completed manually in Firebase Console.

---

## 2. Prerequisites

- Owner or **Editor** role on Firebase project `lextrack-80605`.
- Access to Google Cloud Console for Play Integrity API enablement.
- For iOS DeviceCheck: an active Apple Developer Account.
- SHA-256 fingerprints of all signing keystores (debug + release).

---

## 3. Android — Play Integrity API (Production)

### 3.1 Enable Play Integrity API in Google Cloud

1. Open [Google Cloud Console → APIs & Services → Library](https://console.cloud.google.com/apis/library).
2. Select project `lextrack-80605`.
3. Search for **"Play Integrity API"** and click **Enable**.

> Note: This service is free up to 10,000 requests/day. After that, billing is required.

### 3.2 Register SHA-256 certificate fingerprint(s)

| Keystore | SHA-256 fingerprint |
|----------|---------------------|
| `android/app/debug.keystore` | `91:0D:7D:77:EF:FC:89:3A:55:89:6E:BB:70:82:08:F9:35:4C:45:22:61:31:1C:6B:36:55:AF:41:D8:F3:83:1E` |
| **Release keystore** | `<ADD YOUR RELEASE KEY HERE>` |

#### In Firebase Console
1. Go to **Project settings → Your apps → Android app `com.lextrack`**.
2. Under **SHA certificate fingerprints**, click **Add fingerprint**.
3. Paste the SHA-256 value(s) above and save.
4. If a release keystore exists, repeat for that fingerprint as well.

### 3.3 Enable Play Integrity in App Check

1. Go to **Firebase Console → App Check**.
2. Select the Android app `com.lextrack`.
3. Choose **Play Integrity API**.
4. Click **Save**.

---

## 4. iOS — DeviceCheck (Production)

### 4.1 Enable DeviceCheck in App Check

1. In **Firebase Console → App Check**, select the iOS app.
2. Choose **DeviceCheck**.
3. Provide your Apple Developer Team ID and DeviceCheck private key (downloaded from Apple Developer Portal).
4. Click **Save**.

> If there is **no iOS app registered** in Firebase Console yet: add it in **Project settings → Your apps** with Bundle ID `com.lextrack`.

### 4.2 Xcode / AppDelegate.mm

The native iOS code already initializes the correct provider factory:

```objc
#if DEBUG
  [FIRAppCheck setAppCheckProviderFactory:[[FIRAppCheckDebugProviderFactory alloc] init]];
#else
  [FIRAppCheck setAppCheckProviderFactory:[[FIRDeviceCheckProviderFactory alloc] init]];
#endif
```

No additional Xcode changes are required.

---

## 5. Debug Tokens (for Emulators / CI / Developer Builds)

### 5.1 Android debug token

Run a debug build and extract the token from logcat:

```bash
npm run android
# In another terminal:
adb logcat | grep -i "DebugAppCheckToken"
```

Copy the token value.

### 5.2 iOS debug token

Run a debug build in Xcode and look in the console output for:

```
Firebase App Check debug token: <token>
```

### 5.3 Register tokens in Firebase Console

1. Go to **Firebase Console → App Check → Manage debug tokens**.
2. Click **Add debug token**.
3. Paste the token and assign a label (e.g., `local-dev-mbp`, `ci-builder`).
4. **Delete or deactivate** these tokens before any production release.

---

## 6. Enforce App Check on Firebase Resources

After both Play Integrity and DeviceCheck are successfully receiving attestations, enable enforcement for backend resources.

> **Warning:** Enabling enforcement before clients are updated will break unverified traffic. Ensure all active app builds already include App Check activation (`src/services/appCheck.js`).

### 6.1 Firestore Database

1. Firebase Console → **Firestore Database → App Check** tab.
2. Toggle **Enforce App Check** to **ON**.

### 6.2 Cloud Storage

1. Firebase Console → **Storage → App Check** tab.
2. Toggle **Enforce App Check** to **ON**.

### 6.3 Cloud Functions (Callable)

All callable functions in `functions/src/index.ts` now use `runWith({ enforceAppCheck: true })` (applied in commit `6cbab36`).

This, combined with the runtime `assertAppCheck` assertion, ensures that any request without a valid App Check token is immediately rejected with a `failed-precondition` error before reaching business logic.

---

## 7. Verification Checklist

| # | Step | Expected result |
|---|------|-----------------|
| 1 | Play Integrity API enabled in Google Cloud | API shows "Enabled" |
| 2 | SHA-256 fingerprints added in Firebase Console | At least debug fingerprint present |
| 3 | Play Integrity provider saved in App Check | Green success indicator |
| 4 | DeviceCheck provider saved (iOS) | Green success indicator |
| 5 | Debug tokens registered | Tokens appear in debug-token list |
| 6 | Run Android debug build | `activateAppCheck()` logs success; no `failed-precondition` errors |
| 7 | Run callable function (e.g., EDR search) | Returns data (not 401 / `failed-precondition`) |
| 8 | Temporarily disable debug token and retry | Request blocked (proves enforcement works) |
| 9 | Re-enable debug token | Developer builds work again |
| 10 | **CTO approval** before prod rollout | Confirmed in writing |

---

## 8. Release checklist (before production)

- [ ] Release keystore SHA-256 fingerprint added to Firebase Console.
- [ ] All debug App Check tokens **deleted / deactivated**.
- [ ] `firestore.rules` updated with `request.app` checks if desired (optional — console enforcement is usually sufficient).
- [ ] Cloud Functions `enforceAppCheck: true` applied to all callable handlers.
- [ ] Production APK/AAB tested on a physical device (not emulator).
- [ ] iOS TestFlight build verified with DeviceCheck.
- [ ] CTO sign-off obtained.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `App Check token is missing or invalid` | Debug provider not registered | Add debug token or enable Play Integrity |
| `failed-precondition` from callable | `context.app` null | Ensure `activateAppCheck()` runs before first Firebase call |
| `Play Integrity API error` | SHA-256 fingerprint mismatch | Verify fingerprint matches signing keystore |
| iOS DeviceCheck fails in release | Bundle ID mismatch or missing key | Check Apple Developer Portal config |

---

## 10. References

- [Firebase App Check Docs — Android](https://firebase.google.com/docs/app-check/android/play-integrity-provider)
- [Firebase App Check Docs — iOS](https://firebase.google.com/docs/app-check/ios/devicecheck-provider)
- [React Native Firebase — App Check](https://rnfirebase.io/app-check/usage)
- [Play Integrity API Quotas & Pricing](https://developer.android.com/google/play/integrity/setup#pricing)

---

*Document generated by agent e5180ff0-94c5-422e-8fed-113632fd974c (DevOps‑інженер).*
