# LexTrack Android Production Readiness Checklist
## MYA-16 — Виправлення критичних блокерів Android
**Дата:** 2026-06-13  
**Виконав:** Mobile PM (Agent ID: 9022dcbd-f4c3-45dc-a53b-9a27868f3247)

---

## ✅ ВИПРАВЛЕНО

### 1. versionCode → 3
- Файл: `android/app/build.gradle`
- `versionCode` оновлено з 2 → 3 (обов'язково перед новим релізом Google Play)

### 2. Release signing — захищено від витоку паролів
- Файл: `android/app/build.gradle`
- **ДО:** `storePassword 'lextrack-release-pass'` (hardcoded у git)
- **ПІСЛЯ:** `System.getenv('LEXTRACK_RELEASE_STORE_PASSWORD') ?: localProperties.getProperty('...')`
- Завантаження `local.properties` додано на початку build.gradle
- `.gitignore` оновлено: `local.properties` + `android/local.properties` — ніколи не потраплять у git

### 3. ProGuard rules — вже були покриті Android Developer (MYA-8)
- Файл: `android/app/proguard-rules.pro` — 135 рядків, покрито:
  - React Native core, Hermes, JNI
  - Firebase (Auth, Firestore, Storage, AppCheck, Play Integrity)
  - React Navigation, Reanimated 3.x
  - react-native-pdf, react-native-blob-util, WebView
  - Vector Icons, Document Picker, Image Picker
  - Parcelable, Serializable, JS interfaces
  - Log stripping (`-assumenosideeffects`)

### 4. dataExtractionRules — вже було додано Android Developer (MYA-8)
- Файл: `android/app/src/main/res/xml/data_extraction_rules.xml`
- Повна заборона cloud backup + device transfer (GDPR/юридичні дані)

### 5. Firebase App Check — вже активовано (MYA-8)
- Файл: `src/services/appCheck.ts`
- Debug provider для dev (`__DEV__`), Play Integrity для production
- Native provider: `com.google.firebase:firebase-appcheck-playintegrity`

---

## ⏳ ЩЕ НЕ ВИПРАВЛЕНО (блокер)

### google-services.json — PLACEHOLDER
- Файл: `android/app/google-services.json`
- **БЛОКЕР:** містить `REPLACE_WITH_REAL` для `project_number`, `mobilesdk_app_id`, `api_key`
- **Дія CEO:** завантажити справжній `google-services.json` з Firebase Console (проєкт `lextrack-80605`, пакет `com.lextrack`) та замінити файл
- **Примітка:** цей файл уже у `.gitignore` — не потрапить у публічний репозиторій

---

## 📋 Інструкція для релізного білду

### Крок 1: Підготувати google-services.json
1. Firebase Console → Project Settings → General → Your apps → Android (`com.lextrack`)
2. Завантажити `google-services.json` → замінити `android/app/google-services.json`
3. Переконатися, що SHA-256 релізного ключа додано у Firebase Console

### Крок 2: Підготувати local.properties
Створити `android/local.properties` (не комітити):
```properties
release.storePassword=ВАШ_ПАРОЛЬ_КЕЙСТОРУ
release.keyPassword=ВАШ_ПАРОЛЬ_КЛЮЧА
```

Або через env змінні:
```bash
export LEXTRACK_RELEASE_STORE_PASSWORD="..."
export LEXTRACK_RELEASE_KEY_PASSWORD="..."
export LEXTRACK_RELEASE_KEY_ALIAS="lextrack-release"
```

### Крок 3: Перевірити keystore
```bash
cd android/app
keytool -list -v -keystore release.keystore -alias lextrack-release
```

### Крок 4: Збілдити реліз
```bash
cd android
./gradlew assembleRelease
```

### Крок 5: Завантажити в Google Play Console
- `android/app/build/outputs/apk/release/app-release.apk` → Google Play Console → Internal Testing

---

## ⚠️ Попередження (App Check)

App Check з Play Integrity **працює ТІЛЬКИ** для APK завантажених з Google Play.
Sideloaded APK (встановлені вручну) будуть заблоковані Cloud Functions (`enforceAppCheck: true`).
Для sideload тестування — зареєструйте debug-токен у Firebase Console.

---

*Звіт підготовлено Mobile PM | MYA-6 → MYA-16*
