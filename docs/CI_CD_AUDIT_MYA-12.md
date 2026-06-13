# Аудит CI/CD та інфраструктури деплою LexTrack
## Звіт MYA-12 | DevOps Engineer

---

## 1. GitHub Actions Workflows

### deploy-cloud-functions.yml
| Параметр | Значення | Оцінка |
|----------|----------|--------|
| Тригери | push на main/develop за змінами в `functions/**`, manual dispatch | ✅ |
| Runner | ubuntu-latest | ✅ |
| Node.js | 20 (LTS) | ✅ |
| Кешування npm | cache-dependency-path: functions/package-lock.json | ✅ |
| Build | `npm run build` (TypeScript → lib/) | ✅ |
| Deploy | `firebase deploy --only functions` через FIREBASE_TOKEN | ✅ |
| Cleanup policy | `functions:artifacts:setpolicy --days 30` на main | ✅ |
| **Проблема** | Крок "Dry-run deploy" насправді виконує реальний deploy (не --dry-run), а просто перевіряє ref | ⚠️ |
| **Проблема** | Немає кроку `npm test` перед деплоєм — битий код може піти в прод | 🔴 |
| **Проблема** | Немає `timeout-minutes` на job рівні | ⚠️ |

### deploy-firebase-rules.yml
| Параметр | Значення | Оцінка |
|----------|----------|--------|
| Тригери | push на main/develop за змінами в rules-файлах | ✅ |
| Manual dispatch з choice (default, staging, prod) | ✅ |
| Node.js | **18** — не узгоджено з Cloud Functions workflow (20) | ⚠️ |
| Deploy | Firestore rules + Storage rules разом | ✅ |
| **Проблема** | Немає кроку валідації rules перед деплоєм (`firebase emulators:exec` або `firebase deploy --dry-run`) | 🔴 |
| **Проблема** | Немає `permissions` секції в workflow (security hardening) | ⚠️ |

---

## 2. firebase.json

| Секція | Статус | Примітка |
|--------|--------|----------|
| firestore.rules | ✅ | Посилання на firestore.rules |
| firestore.indexes | ✅ | Посилання на firestore.indexes.json (порожній) |
| functions.source | ✅ | `functions` |
| storage.rules | ✅ | Посилання на storage.rules |
| emulators.firestore | ✅ | host 127.0.0.1, port 8082 |
| emulators.functions | ✅ | port 5003 |
| emulators.storage | ✅ | host 127.0.0.1, port 9201 |
| emulators.ui | ❌ disabled | UI вимкнений — для локальної розробки незручно |
| **hosting** | 🔴 відсутня | Якщо планується веб-версія або Expo Web — потрібно додати |
| **appCheck** | 🔴 відсутня | Немає конфігурації App Check в firebase.json |
| singleProjectMode | ✅ | true — спрощує локальну розробку |

---

## 3. Build-скрипти та автоматизація (scripts/)

### Android CI скрипти
- `setup-android-ci-env.sh` — налаштовує ANDROID_HOME, JAVA_HOME, PATH, LD_LIBRARY_PATH. Використовує хардкодований шлях до JDK (`/home/leo/.gradle/jdks/...`).
- `setup-emulator.sh` — завантажує Android SDK, створює AVD `ci_avd` (Pixel 5, Android 34).
- `run-emulator.sh` — Docker-based headless emulator для visual regression.
- `boot-emulator-headless.sh` — нативний headless emulator з очікуванням boot.
- `start-android-emulator.sh` — foreground/background режими.
- `Dockerfile.emulator` — Ubuntu 22.04 + OpenJDK 17 + libgl1 + libpulse0.

| Проблема | Опис | Ризик |
|----------|------|-------|
| 🔴 | Android SDK шляхи (`android-sdk/`) відсутні в `.gitignore` — можуть потрапити в git | Розмір repo + секрети |
| ⚠️ | `Dockerfile.emulator` не має healthcheck | Невизначений стан контейнера |
| ⚠️ | Немає скрипту cleanup для AVD/emulator процесів | Зависання процесів на CI |
| ⚠️ | `setup-emulator.sh` завантажує ~2GB SDK кожного разу при запуску в чистому середовищі | Повільний CI |

---

## 4. Firebase App Check

### Серверна частина (Cloud Functions)
- ✅ **Всі callable functions** використовують `enforceAppCheck: true`:
  - submitInquiry, getAdminMessagesSummary, searchEdr, searchCourt, searchEnforcement, searchOpendatabot
  - createSignSession, completeSignSession, signDocument
  - initiateKEPAuth, exchangeKEPCode, getKEPToken, scanDocument, writeAuditLog
- ✅ `functions/index.js` (legacy) має `requireAppCheck()` хелпер для перевірки `context.app`
- ✅ Firestore triggers (onCreate/onUpdate) не потребують App Check — коректно

### Клієнтська частина
- 🔴 **Не знайдено** ініціалізації App Check у React Native коді (src/ не повністю проскановано, але немає очевидних файлів app-check)
- Пакет `@react-native-firebase/app-check` присутній у `package.json` dependencies — встановлений, але може не використовуватися

**Рекомендація:** Перевірити та впровадити `activateAppCheck()` у кореневому App-компоненті для Android (Play Integrity) та iOS (DeviceCheck).

---

## 5. Pre-commit hooks (.husky/pre-commit)

```sh
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"
npx eslint .
```

| Проблема | Опис |
|----------|------|
| ⚠️ | Старий формат husky v4 — modern husky (v8+) не потребує `husky.sh` sourcing. Працює, але deprecated. |
| 🔴 | **Немає `prettier --check`** — ESLint не ловить форматування |
| 🔴 | **Немає `npm test`** — тести не запускаються перед комітом |
| 🔴 | **Немає `firebase emulators:exec "npm run test:rules"`** — rules тести не перевіряються |

---

## 6. Firestore Rules & Storage Rules

### firestore.rules
- ✅ rules_version = '2'
- ✅ Гранулярні matcher-и для кожної колекції
- ✅ Enum validators для статусів, пріоритетів, акторів
- ✅ writeSize обмеження (524288 bytes = 512KB)
- ⚠️ **Payment orders** — `allow read` дозволяє клієнту читати всі свої orders, але немає індексу за clientId
- ⚠️ **Registry cache** — `allow read, write: if isAuth()` — занадто широкі права, потенційно cache poisoning

### storage.rules
- ✅ Валідація contentType (image/*, PDF, Office, txt)
- ✅ Обмеження розміру файлу 25MB
- ✅ `isScanned()` gate для читання документів
- ⚠️ Fallback `request.auth.token.email == "lawyer@example.com"` — тестовий email у production rules

---

## 7. Cloud Functions

### Структура
- `functions/src/index.ts` — головний entry point (TypeScript)
- `functions/index.js` — legacy CommonJS приклади (App Check templates) — можна видалити
- `functions/package.json` — Node 20, main: lib/index.js

### Конфігурація
| Функція | Memory | Timeout | enforceAppCheck | Примітка |
|---------|--------|---------|-----------------|----------|
| Callable (більшість) | default | 30s | ✅ | OK |
| scanDocument | 512MB | 60s | ✅ | OK |
| onDocumentUpload | 512MB | 60s | ❌ N/A | Storage trigger — OK |

### Проблеми
- 🔴 **Немає `minInstances` для latency-critical функцій** — cold start ~2-3s
- 🔴 **Всі callable functions мають `maxInstances: 10`** — при піку навантаження може бути throttle
- ⚠️ **Немає retry policy** для Firestore triggers
- ⚠️ **Немає circuit breaker** для зовнішніх API викликів (реєстри: ЄДР, суди, ВП)

---

## Загальні рекомендації по CI/CD

### Пріоритет: Критичний (зробити негайно)
1. **Додати workflow `ci.yml`** — запускати `npm test`, `npm run lint`, `npm run test:rules` на кожному PR
2. **Додати `timeout-minutes`** до всіх jobs (рекомендовано 15-20)
3. **Додати `permissions: contents: read`** до workflows для security hardening
4. **Додати Firebase Rules dry-run** перед деплоєм: `firebase deploy --only firestore:rules --dry-run`
5. **Виправити pre-commit**: додати `prettier --check`, `npm test`, rules tests
6. **Додати `.gitignore`** для `android-sdk/`, `*.log`, coverage/

### Пріоритет: Середній (планувати)
7. Узгодити Node.js версію у всіх workflows (рекомендовано 20 LTS)
8. Додати Dependabot/Renovate для автоматичних оновлень залежностей
9. Додати CODEOWNERS для `.github/workflows/` та `firestore.rules`
10. Додати `minInstances: 1` для latency-critical callable functions (getAdminMessagesSummary, searchEdr)
11. Налаштувати App Check на клієнті (Android Play Integrity + iOS DeviceCheck)
12. Видалити legacy `functions/index.js` або перенести його логіку в `src/`
13. Додати `firebase emulators:exec` для інтеграційних тестів у CI
14. Додати healthcheck до `Dockerfile.emulator`
15. Розглянути Firebase Hosting для веб-версії (якщо актуально)

### Пріоритет: Низький
16. Увімкнути emulator UI для локальної розробки (`"enabled": true`)
17. Додати `--only firestore,functions,storage` до emulator команди для швидшого старту
18. Додати `concurrency` ліміти до workflows (group by PR/branch)

---

## Висновок

CI/CD LexTrack має **базовий рівень** автоматизації деплою Cloud Functions та Firebase Rules, але **критично бракує:**
- Автоматичного запуску тестів перед деплоєм
- Валідації rules перед деплоєм
- Pre-commit валідації (formatting, tests)
- Security hardening (permissions, timeout)
- Клієнтської конфігурації App Check

**Загальна оцінка: 5/10** — функціонує для деплою, але не захищає від битого коду та помилок у rules.
