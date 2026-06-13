# Аудит Android-частини LexTrack (MYA-8)
**Дата:** 2026-06-13
**Виконав:** Android Developer
**Робоча директорія:** /home/leo/.paperclip/instances/default/projects/456f56ad-7d71-432f-b9dd-ec1ebe7ac37c/f9091112-352d-4802-8a62-eed32f13526d/_default

---

## 1. Перевірка android/build.gradle, android/app/build.gradle

### android/build.gradle (root)
```
buildToolsVersion = "34.0.0"
minSdkVersion = 23
compileSdkVersion = 34
targetSdkVersion = 34
ndkVersion = "25.1.8937393"
kotlinVersion = "1.8.0"
classpath("com.android.tools.build:gradle:8.1.1")
classpath("com.google.gms:google-services:4.4.1")
```

**Оцінка:** ✅ Нормально. SDK 34, AGP 8.1.1, Google Services 4.4.1 — сумісні з RN 0.73.6. Kotlin 1.8.0 старіший, але підтримується.

### android/app/build.gradle
- `versionCode 2`, `versionName "1.0.1"` — потребує інкременту перед релізом.
- `signingConfig` для release використовує DEBUG-keystore — ❌ **КРИТИЧНО**: релізний білд підписується debug-ключем.
- `minifyEnabled enableProguardInReleaseBuilds` — залежить від визначення `enableProguardInReleaseBuilds` (не бачу явного true/false).

---

## 2. Перевірка google-services.json

**Статус:** ❌ **PLACEHOLDER-ФАЙЛ**

Файл містить коментар: "Це placeholder-файл. Після реєстрації Android app у Firebase Console... замініть цей файл на справжній".

- `project_id: lextrack-80605` — проєкт існує, але `mobilesdk_app_id`, `api_key` — PLACEHOLDER.
- **БЛОКЕР:** Без справжнього google-services.json додаток НЕ запуститься з Firebase.

---

## 3. Аудит AndroidManifest.xml, налаштувань ProGuard

### AndroidManifest.xml
- ✅ Дозволи: INTERNET, CAMERA, READ_EXTERNAL_STORAGE, READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, POST_NOTIFICATIONS, ACCESS_NETWORK_STATE — коректні.
- ✅ Deep link `lextrack://kep` налаштований.
- ⚠️ Відсутній `android:exported="false"` для activity? — Є exported="true" на MainActivity (необхідно для launcher).
- ⚠️ `android:allowBackup="false"` — правильно для конфіденційного додатку юридичної фірми.
- ❌ **Відсутні** налаштування для `android:dataExtractionRules` (Android 12+ backup restrictions).
- ❌ Відсутній `android:usesCleartextTraffic` — добре (HTTPS by default).

### proguard-rules.pro
- ❌ **КРИТИЧНО:** Файл майже порожній. Firebase, React Navigation, Reanimated, PDF-рендерер потребують keep-правил для ProGuard.

---

## 4. Перевірка Firebase App Check (Play Integrity)

### Код (src/services/appCheck.js)
```js
const provider = Platform.OS === 'android' ? 'playintegrity' : 'deviceCheck';
const chosenProvider = __DEV__ ? 'debug' : provider;
await appCheck().activate(chosenProvider, true);
```

- ✅ Логіка правильна: debug для dev, playintegrity для Android production.
- ✅ Auto-refresh enabled (`true` другим параметром).

### Native-залежність (android/app/build.gradle)
```
implementation("com.google.firebase:firebase-appcheck-playintegrity")
```

- ✅ Провайдер Play Integrity підключений.

**АЛЕ:**
- ⚠️ **App Check працює ТІЛЬКИ** якщо додаток завантажено з Google Play (або debug-токен зареєстрований). Сторонні APK/sideload — блокуватимуться.
- ❌ **Відсутнє** керування debug-токенами для CI/emulator тестування.
- ❌ У google-services.json PLACEHOLDER — App Check фізично не запуститься.

---

## 5. Сумісність з React Native 0.73.6

### package.json
```
"react-native": "0.73.6"
"react": "18.2.0"
```

**Оцінка сумісності:**
| Компонент | Версія | Сумісність з RN 0.73.6 |
|-----------|--------|------------------------|
| @react-native-firebase/* | ^19.0.0 | ✅ Підтримується |
| react-native-reanimated | ^3.8.0 | ✅ Підтримується |
| react-native-screens | ^3.30.0 | ✅ Підтримується |
| react-native-gesture-handler | ^2.16.0 | ✅ Підтримується |
| react-native-safe-area-context | ^4.9.0 | ✅ Підтримується |
| react-native-pdf | ^6.7.5 | ✅ Підтримується |
| react-native-vector-icons | ^10.0.3 | ✅ Підтримується |
| react-native-webview | ^13.8.0 | ✅ Підтримується |
| react-native-document-picker | ^9.1.1 | ✅ Підтримується |
| react-native-image-picker | ^7.1.2 | ✅ Підтримується |
| react-native-blob-util | ^0.19.9 | ✅ Підтримується |
| @tanstack/react-query | ^5.40.0 | ✅ Підтримується |

**Проблеми:**
- ⚠️ `@react-native/babel-preset": "0.73.21"` vs `@react-native/metro-config": "0.73.5"` — версії babel-preset і metro-config різні. Для RN 0.73.6 рекомендовано узгодити до 0.73.x.
- ⚠️ `metro-react-native-babel-preset": "0.73.10"` — застарілий preset, має бути `@react-native/babel-preset`.

---

## 6. Список БЛОКЕРІВ та РЕКОМЕНДАЦІЙ

### 🔴 БЛОКЕРИ (випуск на production заблокований)
1. **google-services.json — PLACEHOLDER** — Firebase повністю не працює (Auth, Firestore, Storage, Messaging, App Check).
2. **Release signing config використовує debug.keystore** — небезпечно; потрібен окремий release keystore.
3. **ProGuard rules порожні** — release збірка з minifyEnabled=true призведе до runtime crashes (Firebase, Navigation, Reanimated).

### 🟡 ВИСОКИЙ ПРІОРИТЕТ
4. **AndroidManifest.xml** — додати `android:dataExtractionRules` для Android 12+ (backup/restore restrictions).
5. **ProGuard** — додати keep-правила для Firebase, React Navigation, Reanimated, react-native-pdf.
6. **Gradle heap** — `org.gradle.jvmargs=-Xmx2048m` — для складних залежностей може не вистачити; рекомендовано 4096m.
7. **Kotlin version** — 1.8.0 старий; оновлення до 1.9.x зменшить deprecation warnings.

### 🟢 РЕКОМЕНДАЦІЇ
8. **App Check debug tokens** — налаштувати для CI/emulator тестування.
9. **versionCode** — інкрементувати перед кожним релізом.
10. **metro-react-native-babel-preset** — видалити з devDependencies (дублює `@react-native/babel-preset`).
11. **Babel preset / metro config версії** — узгодити з RN 0.73.6.

---

## 7. Підсумок для Mobile PM та CEO

**Android-частина LexTrack (RN 0.73.6) технічно спроєктована коректно, але містить 3 КРИТИЧНИХ блокери, які перешкоджають production-релізу:**

1. Необхідно замінити PLACEHOLDER google-services.json на реальний файл з Firebase Console.
2. Налаштувати release signing з окремим keystore (не debug).
3. Заповнити ProGuard rules для усіх нативних залежностей.

**Сумісність з React Native 0.73.6:** загальна — задовільна, усі основні залежності підтримуються.

**Час на усунення блокерів:** ~2-4 години роботи Android Developer + налаштування Firebase Console адміністратором.
