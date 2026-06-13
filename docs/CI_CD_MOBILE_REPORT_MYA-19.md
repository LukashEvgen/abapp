# CI/CD Mobile Pipeline — LexTrack
## Виконав: DevOps Engineer (MYA-19) | Проєкт: Mobile Apps

---

## 1. Що було зроблено

Повноцінний CI/CD pipeline для Android та iOS платформ LexTrack з автоматизованим build, test та deploy.

### Створені GitHub Actions workflows

| Workflow | Призначення | Тригер |
|----------|-------------|--------|
| `ci.yml` | Lint, unit tests, Firestore rules tests, functions tests, rules validation | PR та push до main/develop |
| `android-build.yml` | Build APK/AAB, Firebase App Distribution, Android E2E tests (Maestro) | Push до main/develop (зміни в android/src), manual dispatch |
| `ios-build.yml` | Build iOS archive, Firebase App Distribution (staging), TestFlight (prod), iOS E2E tests | Push до main/develop (зміни в ios/src), manual dispatch |

### Android pipeline (`android-build.yml`)

**Build job:**
- Ubuntu runner, JDK 17, Android SDK 34
- Debug APK (develop branch) → артефакт
- Release AAB (main branch) → артефакт + mapping
- Code signing через env vars → decoded keystore
- Таймаут: 30 хв

**Firebase Distribution:**
- Debug APK → група `qa-team` (staging)
- Release AAB → групи `beta-testers, qa-team` (production)
- Автоматичні release notes з commit SHA та run number

**E2E Tests:**
- Android emulator API 29 та 34 (matrix strategy)
- Maestro framework для E2E тестів
- Headless emulator з GPU swiftshader_indirect
- JUnit reporting та артефакти результатів

### iOS pipeline (`ios-build.yml`)

**Build job:**
- macOS runner, Xcode latest-stable, Node 20
- Fastlane Match для code signing (development, adhoc, appstore)
- Staging IPA (adhoc, develop branch)
- Production archive (app-store, main branch)
- Таймаут: 45 хв

**Firebase Distribution (iOS):**
- Staging IPA → група `qa-team`
- Для QA тестування перед TestFlight

**TestFlight:**
- Автоматичний upload до App Store Connect
- App Store Connect API Key auth (без Apple ID пароля)
- Skip waiting for processing (non-blocking)
- Beta changelog з run info

**E2E Tests:**
- iOS Simulator (iPhone 15)
- Maestro E2E тести
- Build для simulator + install + test

### Основний CI workflow (`ci.yml`)

| Job | Опис | Таймаут |
|-----|------|---------|
| `lint` | ESLint + Prettier check | 10 хв |
| `unit-tests` | Jest unit tests + Codecov upload | 15 хв |
| `firestore-rules-tests` | Firebase rules unit tests | 10 хв |
| `functions-tests` | Cloud Functions build + tests | 10 хв |
| `validate-firebase-rules` | Dry-run deploy rules | 5 хв |

### E2E тести (Maestro)

Створено E2E сценарії:
- `e2e/android/login.yaml` — Login flow на Android
- `e2e/ios/login.yaml` — Login flow на iOS
- `e2e/.maestro/config.yaml` — Глобальна конфігурація

Тести включають: launch app → fill credentials → sign in → verify dashboard visible.

### Code Signing Automation

**Android:**
- Скрипт: `scripts/ci/setup-android-signing.sh`
- Base64-encoded keystore → decode → local.properties → gradle.properties
- Підтримка staging/production environments

**iOS:**
- Скрипт: `scripts/ci/setup-ios-signing.sh`
- Fastlane Match з окремим Git repo для сертифікатів
- App Store Connect API Key для TestFlight
- Підтримка development/adhoc/appstore profiles

**Fastlane lanes (`ios/fastlane/Fastfile`):**
- `build_staging` — Ad Hoc IPA для QA
- `build_release` — App Store archive
- `upload_testflight` — Upload з API Key auth
- `sync_signing` — Sync certificates via Match

### Deployment Script

- `scripts/ci/deploy-mobile.sh` — універсальний скрипт deploy
- Підтримує android/ios × staging/production
- Firebase App Distribution через CLI
- TestFlight через Fastlane

---

## 2. Required GitHub Secrets

Наступні secrets потрібно додати в GitHub repository (Settings → Secrets → Actions):

### Firebase
| Secret | Опис | Де використовується |
|--------|------|---------------------|
| `FIREBASE_TOKEN` | Firebase CLI token (`firebase login:ci`) | Всі deploy workflow |
| `FIREBASE_ANDROID_APP_ID` | Android app ID (напр. `1:123:android:abc`) | Android deploy |
| `FIREBASE_IOS_APP_ID` | iOS app ID (напр. `1:123:ios:xyz`) | iOS deploy |

### Android Signing
| Secret | Опис | Де використовується |
|--------|------|---------------------|
| `ANDROID_RELEASE_KEYSTORE_BASE64` | Base64 release.keystore | Android release build |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | Android release build |
| `ANDROID_KEY_PASSWORD` | Key password | Android release build |
| `ANDROID_KEY_ALIAS` | Key alias | Android release build |

### iOS Signing
| Secret | Опис | Де використовується |
|--------|------|---------------------|
| `MATCH_PASSWORD` | Match repo encryption password | iOS code signing |
| `MATCH_GIT_URL` | Git URL для Match certificates repo | iOS code signing |
| `APPLE_TEAM_ID` | Apple Developer Team ID | iOS code signing |

### App Store Connect
| Secret | Опис | Де використовується |
|--------|------|---------------------|
| `APP_STORE_CONNECT_API_KEY_ID` | API Key ID | TestFlight upload |
| `APP_STORE_CONNECT_API_ISSUER_ID` | Issuer ID | TestFlight upload |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | Base64 API key (.p8) | TestFlight upload |
| `FASTLANE_PASSWORD` | Apple ID password (fallback) | iOS Match |

### Optional
| Secret | Опис |
|--------|------|
| `CODECOV_TOKEN` | Codecov.io upload token (для coverage reports) |

---

## 3. Як налаштувати з нуля

### Крок 1: Firebase проєкти

1. Створити staging проєкт: `firebase projects:create lextrack-staging`
2. Створити production проєкт: `firebase projects:create lextrack-prod`
3. Додати Android/iOS apps у кожен проєкт → отримати App IDs
4. Налаштувати Firebase App Distribution groups: `qa-team`, `beta-testers`

### Крок 2: Android signing

1. Створити release keystore:
```bash
keytool -genkey -v -keystore release.keystore -alias lextrack-release \
  -keyalg RSA -keysize 2048 -validity 10000
```
2. Закодувати в base64: `base64 -w 0 release.keystore`
3. Додати в GitHub secrets

### Крок 3: iOS signing (Fastlane Match)

1. Створити окремий приватний Git repo для сертифікатів
2. Ініціалізувати Match:
```bash
cd ios
fastlane match init
git_url "https://github.com/your-org/lextrack-certificates.git"
```
3. Створити профілі:
```bash
fastlane match development
fastlane match adhoc
fastlane match appstore
```
4. Додати MATCH_PASSWORD та MATCH_GIT_URL в GitHub secrets

### Крок 4: App Store Connect API Key

1. App Store Connect → Users → Keys → Generate API Key
2. Download `.p8` файл
3. Закодувати в base64: `base64 -w 0 AuthKey_XXX.p8`
4. Додати APP_STORE_CONNECT_* secrets

### Крок 5: Firebase CLI Token

```bash
firebase login:ci
```
Додати токен в `FIREBASE_TOKEN`

---

## 4. Як запустити вручну

### Android staging (debug APK)
GitHub Actions → `Android Build & Deploy` → Run workflow:
- environment: `staging`
- distribute: `true`

### Android production (release AAB)
Push до `main` branch → автоматичний trigger або manual dispatch з `production`.

### iOS staging (Ad Hoc IPA)
GitHub Actions → `iOS Build & Deploy` → Run workflow:
- environment: `staging`
- upload_to_testflight: `false`

### iOS production (TestFlight)
Push до `main` branch → автоматичний trigger або manual dispatch з `production` та `upload_to_testflight: true`.

### E2E тести
E2E запускаються автоматично на push до `main`/`develop`. Для ручного запуску:
```bash
cd e2e
maestro test android/login.yaml
maestro test ios/login.yaml
```

---

## 5. Структура нових файлів

```
.github/workflows/
  ci.yml                          ← Новий: основний CI
  android-build.yml               ← Новий: Android build/deploy/E2E
  ios-build.yml                   ← Новий: iOS build/deploy/E2E/TestFlight
  deploy-cloud-functions.yml      ← Існуючий (оновлений)
  deploy-firebase-rules.yml       ← Існуючий (оновлений)

ios/fastlane/
  Fastfile                        ← Новий: Fastlane lanes

e2e/
  .maestro/config.yaml            ← Новий: Maestro config
  android/login.yaml              ← Новий: Android E2E test
  ios/login.yaml                  ← Новий: iOS E2E test

scripts/ci/
  setup-android-signing.sh        ← Новий: Android signing automation
  setup-ios-signing.sh           ← Новий: iOS signing automation (Match)
  deploy-mobile.sh               ← Новий: Unified deploy script
```

---

## 6. Покращення порівняно з поточним станом

| Аспект | Було (MYA-12 audit) | Стало (MYA-19) |
|--------|---------------------|----------------|
| Тести перед деплоєм | ❌ Немає | ✅ Lint, unit, rules, E2E |
| CI/CD для mobile | ❌ Тільки Cloud Functions | ✅ Android + iOS pipelines |
| Firebase App Distribution | ❌ Відсутня | ✅ Android + iOS staging/prod |
| TestFlight automation | ❌ Відсутня | ✅ API Key auth, auto-upload |
| E2E тести | ❌ Відсутні | ✅ Maestro для обох платформ |
| Code signing automation | ❌ Ручний | ✅ Fastlane Match + scripts |
| Release notes | ❌ Відсутні | ✅ Auto-generated з git info |
| Timeout на jobs | ❌ Відсутні | ✅ 5-45 хв залежно від job |
| Permissions hardening | ❌ Відсутні | ✅ `contents: read` |
| Coverage reports | ❌ Відсутні | ✅ Codecov upload |

---

## 7. Відомі обмеження та наступні кроки

1. **Maestro E2E** — базовий login flow. Потрібно розширити: case creation, document upload, KEP flow.
2. **iOS E2E** — simulator-only. Для physical device testing потрібен App Center або Firebase Test Lab.
3. **Firebase Test Lab** — розглянути для Android фізичних девайсів.
4. **Play Store** — потрібен Google Service Account для автоматичного upload до Google Play Console (AAB → Internal Testing).
5. **Notification** — додати Slack/Telegram notifications після deploy.
6. **Rollback** — додати workflow для швидкого rollback до попередньої версії.

---

## 8. Контакт

Питання щодо CI/CD pipeline — звертайтесь до DevOps Engineer (Paperclip Agent).