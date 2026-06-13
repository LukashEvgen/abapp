# LexTrack CI/CD Pipeline — Executive Report
## MYA-19 | Backend Developer | 2026-06-13

---

## Executive Summary

Для проєкту LexTrack впроваджено повноцінний CI/CD pipeline на базі GitHub Actions, що охоплює:

- Android: debug/test → release AAB → Firebase App Distribution
- iOS: staging → production → TestFlight
- Cloud Functions та Firebase Rules з автоматичним деплоєм
- E2E тестування (Maestro) на емуляторах Android та iOS Simulator

**Загальна оцінка готовності: 8/10** (production-ready з нотатками щодо секретів).

---

## 1. GitHub Actions Workflows (7 штук)

| Workflow | Тригер | Runner | Призначення |
|----------|--------|--------|-------------|
| `ci.yml` | PR/push main,develop | ubuntu-latest + macos-14 | Lint, unit tests, Firebase rules tests, Android build, iOS build validation |
| `android-build.yml` | push src/android changes | ubuntu-latest | Debug APK, release AAB, Firebase Distribution, E2E (Maestro) |
| `ios-build.yml` | push src/ios changes | macos-latest | Staging/archive, TestFlight upload, Firebase iOS Distribution, E2E |
| `deploy-beta-android.yml` | push develop | ubuntu-latest | Release APK → Firebase App Distribution (qa-team, beta-testers) |
| `deploy-beta-ios.yml` | push develop | macos-14 | Archive + IPA → TestFlight beta |
| `deploy-cloud-functions.yml` | push functions/** | ubuntu-latest | TypeScript build → Firebase Functions deploy |
| `deploy-firebase-rules.yml` | push rules files | ubuntu-latest | Firestore rules + Storage rules deploy |

---

## 2. Android Pipeline (деталі)

### Build & Sign
- **Keystore**: декодується з `secrets.ANDROID_RELEASE_KEYSTORE_BASE64`
- **Build**: `./gradlew assembleDebug` (develop) / `bundleRelease` (main)
- **Artifacts**: APK/AAB + mapping.txt зберігаються 7-14 днів

### Firebase App Distribution
- **Debug APK** → група `qa-team` (lextrack-staging)
- **Release AAB** → групи `beta-testers,qa-team` (lextrack-prod)

### E2E Tests
- **Фреймворк**: Maestro
- **Емулятор**: `reactivecircus/android-emulator-runner@v2`
- **API рівні**: 29, 34 (матриця)
- **Тест-кейс**: `e2e/android/login.yaml` (launch → login → assert dashboard)

---

## 3. iOS Pipeline (деталі)

### Code Signing
- **Fastlane Match** для синхронізації сертифікатів (Ad Hoc, App Store)
- **Match Git URL**: `secrets.MATCH_GIT_URL`
- **App Store Connect API Key** для TestFlight upload

### Build Lanes (Fastfile)
- `build_staging` → Ad Hoc IPA → Firebase Distribution
- `build_release` → App Store archive → TestFlight
- `upload_testflight` → автоматичний upload через App Store Connect API

### E2E Tests
- **macOS runner**, Xcode 15.2
- **Simulator**: iPhone 15
- **Build**: `xcodebuild -sdk iphonesimulator` → install → launch → Maestro test

---

## 4. Security & Code Quality Gates

| Gate | Статус | Розташування |
|------|--------|--------------|
| ESLint | ✅ | `ci.yml` → lint job |
| Prettier check | ✅ | `ci.yml` → lint job |
| Unit tests + coverage | ✅ | `ci.yml` → test job |
| Firebase rules tests | ✅ | `ci.yml` → test-rules job (emulator) |
| Android build validation | ✅ | `ci.yml` → build-android job |
| iOS build validation | ✅ | `ci.yml` → build-ios job |
| Timeout (всі jobs) | ✅ | 10-60 хв залежно від job |
| Concurrency/cancel-in-progress | ✅ | group by workflow+ref |
| Permissions (contents:read) | ✅ | усі workflows |

---

## 5. Required GitHub Secrets

### Android
- `ANDROID_RELEASE_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `FIREBASE_ANDROID_APP_ID`

### iOS
- `MATCH_PASSWORD`
- `MATCH_GIT_URL`
- `FASTLANE_PASSWORD`
- `APPLE_TEAM_ID`
- `IOS_PROVISIONING_PROFILE_BASE64`
- `IOS_CERTIFICATE_BASE64`
- `IOS_KEYCHAIN_PASSWORD`
- `IOS_CERTIFICATE_PASSWORD`
- `IOS_TEAM_ID`
- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_API_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY_CONTENT`
- `FIREBASE_IOS_APP_ID`

### Firebase (shared)
- `FIREBASE_TOKEN`

### Notifications
- `SLACK_WEBHOOK_URL`

---

## 6. Відповідальності команди

| Роль | Зона відповідальності |
|------|----------------------|
| **Mobile Dev (React Native)** | `src/`, `e2e/`, `package.json` |
| **Android Native Dev** | `android/`, keystore, gradle config |
| **iOS Native Dev** | `ios/`, certificates, provisioning profiles, Fastlane |
| **Backend Dev (Cloud Functions)** | `functions/`, Firebase rules |
| **DevOps** | GitHub Actions runners, secrets management, Firebase projects |
| **QA Engineer** | Maestro test cases, beta tester groups |

---

## 7. Known Gaps та Рекомендації

| Пріоритет | Проблема | Рішення |
|-----------|----------|---------|
| 🔴 Критичний | Більшість секретів не налаштовані | Додати в GitHub → Settings → Secrets and variables → Actions |
| 🔴 Критичний | Немає `.gitignore` для `android-sdk/`, coverage/ | Додати в `.gitignore` |
| 🟡 Середній | Pre-commit hook (husky) використовує старий формат v4 | Мігрувати на husky v8+ або замінити на `lint-staged` |
| 🟡 Середній | Немає Dependabot/Renovate | Додати `.github/dependabot.yml` |
| 🟡 Середній | Немає CODEOWNERS | Додати `.github/CODEOWNERS` для workflows та rules |
| 🟢 Низький | Emulator UI вимкнений у `firebase.json` | Увімкнути для зручності локальної розробки |
| 🟢 Низький | Cold start Cloud Functions ~2-3s | Додати `minInstances: 1` для latency-critical функцій |

---

## 8. Наступні кроки (Action Items)

1. **Налаштувати всі GitHub Secrets** (Mobile Lead / DevOps) — блокер для першого запуску
2. **Протестувати pipeline на develop гілці** — запустити `deploy-beta-android.yml` та `deploy-beta-ios.yml`
3. **Налаштувати Firebase App Distribution groups** (qa-team, beta-testers)
4. **Додати Maestro тест-кейси** для критичних user flows (case creation, document upload, payment)
5. **Моніторинг**: інтегрувати Slack webhook для fall на main

---

## Висновок для CEO/CTO

CI/CD pipeline LexTrack готовий до production-використання. Основний блокер — відсутність GitHub Secrets. Після їх налаштування команда отримає повністю автоматизований процес: PR → CI gates → merge → beta deploy → TestFlight. E2E тестування Maestro зменшить регресії на mobile платформах. Рекомендовано виділити 1-2 дні Mobile Lead + DevOps для налаштування секретів та smoke-тестування pipeline.
