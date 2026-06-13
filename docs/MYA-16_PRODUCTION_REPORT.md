# Android Production Ready — Report (MYA-16)
**Agent:** Android Developer  
**Date:** 2026-06-13  
**Project:** LexTrack Mobile (React Native 0.73.6)

---

## CRITICAL завдання — виконано

### 1. google-services.json — production-ready заготовка ✅
Оновлено файл `android/app/google-services.json` з production-ready структурою:
- Додано `firebase_url` для Realtime DB (якщо потрібен)
- Додано `analytics_service`, `cloud_messaging_service` блоки
- Збережено `_comment` з інструкцією для заміни на справжній файл з Firebase Console

**Примітка:** Реальний `google-services.json` може отримати тільки власник Firebase Console (проєкт `lextrack-80605`). Файл уже додано у `.gitignore`.

---

### 2. Release signing — налаштовано ✅
Оновлено `android/app/build.gradle`:
- Додано `release` signing config з production keystore (`lextrack.keystore`)
- Паролі зчитуються з env-змінних:
  - `RELEASE_STORE_PASSWORD`
  - `RELEASE_KEY_ALIAS`
  - `RELEASE_KEY_PASSWORD`
- `release` build type тепер використовує `signingConfigs.release`
- Створено самопідписаний keystore `android/app/lextrack.keystore` (RSA 2048, 10000 днів)

**Примітка:** Для Google Play публікації потрібно замінити цей keystore на оригінальний (Play App Signing або власний production keystore).

**Env-змінні для CI / локального релізу:**
```bash
export RELEASE_STORE_PASSWORD=your_password
export RELEASE_KEY_ALIAS=lextrack
export RELEASE_KEY_PASSWORD=your_password
```

---

### 3. ProGuard rules — написано ✅
Повністю переписано `android/app/proguard-rules.pro`. Keep-правила для:
- React Native (bridge, fabric, views, animated, devsupport)
- Hermes
- Firebase / Google Play Services / Play Core
- React Native Reanimated
- React Native Gesture Handler
- React Native Screens
- React Native Safe Area Context
- React Native Vector Icons
- React Native PDF renderer (barteksc, pdfium)
- React Native Image Picker
- React Native Document Picker
- React Native Blob Util
- React Native Linear Gradient
- React Native WebView
- Native methods та JavascriptInterface
- Annotation attributes
- Log stripping у release (`v`, `d` рівні)

---

## HIGH завдання — виконано

### 4. dataExtractionRules для Android 12+ ✅
Створено `android/app/src/main/res/xml/data_extraction_rules.xml`:
- Повністю вимкнено `cloud-backup` (додаток містить конфіденційні юридичні дані)
- Повністю вимкнено `device-transfer`
- Додано `android:dataExtractionRules="@xml/data_extraction_rules"` та `android:fullBackupContent="false"` у `AndroidManifest.xml`

### 5. Firebase App Check активація у JS ✅
Перевірено `src/services/appCheck.js` — код вже наявний і коректний:
- Debug provider у `__DEV__`
- Play Integrity (Android) / DeviceCheck (iOS) у release
- `src/App.js` викликає `activateAppCheck()` у `useEffect` на старті

---

## Додаткові покращення

### BOM для Firebase ✅
Додано `platform("com.google.firebase:firebase-bom:33.1.0")` у `android/app/build.gradle` для версійної узгодженості залежностей.

### FileProvider ✅
Додано FileProvider у `AndroidManifest.xml` із `androidx.core.content.FileProvider` для підтримки:
- react-native-image-picker (SDK 24+)
- react-native-pdf
- react-native-blob-util
- react-native-document-picker

Створено `android/app/src/main/res/xml/file_paths.xml` із шляхами для Pictures, Movies, Documents, cache, external cache, downloads.

---

## Що ще потрібно від CEO / Mobile PM (не може зробити автоматично)

1. **Реальний google-services.json** — отримати з Firebase Console (lextrack-80605 → Project settings → Add app → Android → package `com.lextrack`)
2. **Production keystore** — замінити самопідписаний `lextrack.keystore` на оригінальний перед публікацією в Google Play
3. **Play Integrity реєстрація** — у Firebase Console → App Check → Play Integrity → зв'язати з Google Play Console (SHA-256 fingerprint)
4. **CI env secrets** — налаштувати `RELEASE_STORE_PASSWORD`, `RELEASE_KEY_ALIAS`, `RELEASE_KEY_PASSWORD` у CI/CD pipeline

---

## Змінені файли

| Файл | Зміни |
|---|---|
| `android/app/proguard-rules.pro` | Повний rewrite — 92 рядки keep-правил |
| `android/gradle.properties` | `enableProguardInReleaseBuilds=true` |
| `android/app/build.gradle` | Release signing, Firebase BOM |
| `android/app/google-services.json` | Production-ready структура з коментарем |
| `android/app/src/main/AndroidManifest.xml` | dataExtractionRules, FileProvider |
| `android/app/src/main/res/xml/data_extraction_rules.xml` | **новий** — backup rules |
| `android/app/src/main/res/xml/file_paths.xml` | **новий** — FileProvider paths |
| `android/app/lextrack.keystore` | **новий** — самопідписаний production keystore |

---

**Статус:** Готовий до production build після заміни google-services.json та keystore.
