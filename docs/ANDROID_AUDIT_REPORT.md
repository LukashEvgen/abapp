# Android Audit Report — LexTrack (MYA-8)
**Agent:** Android Developer  
**Date:** 2026-06-13  
**Project:** LexTrack Mobile (React Native 0.73.6)  

---

## 1. android/build.gradle — вердикт: потребує оновлень

| Параметр | Поточне | Рекомендація |
|---|---|---|
| `buildToolsVersion` | 34.0.0 | ОК |
| `minSdkVersion` | 23 | ОК (API 23 = Android 6.0) |
| `compileSdkVersion` | 34 | ОК |
| `targetSdkVersion` | 34 | **Підняти до 35** перед публікацією в Google Play (липень 2025 — targetSdk 35 обов'язковий для нових додатків) |
| `ndkVersion` | 25.1.8937393 | ОК для RN 0.73 |
| `kotlinVersion` | 1.8.0 | ОК для RN 0.73 |
| `com.android.tools.build:gradle` | 8.1.1 | ОК |
| `com.google.gms:google-services` | 4.4.1 | ОК |

**Блокер:** `targetSdkVersion` має бути піднято до 35 для нових релізів.

---

## 2. android/app/build.gradle — вердикт: КРИТИЧНІ ПОМИЛКИ

### 2.1 `enableProguardInReleaseBuilds` не визначена
```gradle
minifyEnabled enableProguardInReleaseBuilds
```
Ця змінна **не існує** в `gradle.properties` і не визначена в `build.gradle`. Release build **зламається**.

**Рекомендація:** Додати у `android/gradle.properties`:
```properties
enableProguardInReleaseBuilds=true
```
або замінити на:
```gradle
minifyEnabled true
```

### 2.2 Release signing — DEBUG keystore
```gradle
release {
    signingConfig signingConfigs.debug
}
```
Release білд підписується debug.keystore. Це **блокує публікацію** в Google Play.

**Рекомендація:** Створити production signing config:
```gradle
signingConfigs {
    debug { ... }
    release {
        storeFile file('lextrack.keystore')
        storePassword System.getenv("RELEASE_STORE_PASSWORD")
        keyAlias System.getenv("RELEASE_KEY_ALIAS")
        keyPassword System.getenv("RELEASE_KEY_PASSWORD")
    }
}
```

### 2.3 Firebase App Check без версії
```gradle
implementation("com.google.firebase:firebase-appcheck-playintegrity")
```
Відсутня версія BOM — може призвести до несумісності.

**Рекомендація:** Додати BOM або явну версію:
```gradle
implementation platform('com.google.firebase:firebase-bom:33.1.0')
implementation("com.google.firebase:firebase-appcheck-playintegrity")
```

---

## 3. google-services.json — вердикт: PLACEHOLDER (КРИТИЧНО)

Файл містить тільки placeholder-значення (`PLACEHOLDER` для project_number, mobilesdk_app_id, api_key).

**Блокер:** Додаток **не зможе** ініціалізувати Firebase (Auth, Firestore, Messaging, Storage, App Check).

**Рекомендація:**
1. Зайти в Firebase Console → lextrack-80605 → Project settings → Add app → Android
2. Вказати package name: `com.lextrack`
3. Завантажити справжній `google-services.json`
4. Замінити файл у `android/app/`
5. **Не комітити** реальний файл у публічний репозиторій (додати у `.gitignore`)

---

## 4. AndroidManifest.xml — вердикт: неповний (СРЕДНЄ)

### Що є:
- INTERNET, CAMERA, STORAGE, NOTIFICATIONS ✅
- `android:allowBackup="false"` ✅ (security best practice)
- Deep link `lextrack://kep` ✅
- `android:exported="true"` на MainActivity ✅

### Чого бракує:
1. **`android:exported` на `<application>`** — не обов'язково, але рекомендується для Android 12+
2. **`android:dataExtractionRules`** для Android 12+ (backup/restore rules)
3. **`android:localeConfig`** для Android 13+ per-app language (якщо планується локалізація)
4. **NetworkSecurityConfig** — для налаштувань cleartext traffic у dev
5. **`android:usesCleartextTraffic`** — потрібно явно заборонити у production
6. **FileProvider** — для камери/документів (react-native-image-picker потребує FileProvider для SDK 24+)

**Рекомендація:** Додати FileProvider у AndroidManifest.xml:
```xml
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="${applicationId}.provider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths" />
</provider>
```

---

## 5. ProGuard (android/app/proguard-rules.pro) — вердикт: порожній (СРЕДНЄ)

Файл містить тільки шаблон. Для Firebase, React Navigation, Reanimated потрібні keep-правила.

**Рекомендація:** Додати правила:
```proguard
# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# React Native
-keep class com.facebook.react.bridge.** { *; }
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}
```

---

## 6. Firebase App Check (Play Integrity) — вердикт: КОНФІГУРАЦІЯ ВІДСУТНЯ (КРИТИЧНО)

У `package.json` є залежність `@react-native-firebase/app-check` версії `^19.3.0`, але **жодного JS-коду** для активації App Check не знайдено.

**Рекомендація:** Додати активацію App Check у `src/` (наприклад, у `App.js` або `AuthContext.js`):
```javascript
import { firebase } from '@react-native-firebase/app-check';

const appCheck = firebase.appCheck();
appCheck.activate('ignored', true); // true = activate on debug builds too
```

Для production (Play Integrity):
1. У Firebase Console → App Check → Apps → Android → Play Integrity
2. Завантажити SHA-256 fingerprint
3. Зв'язати з Google Play Console

**Примітка:** Play Integrity вимагає публікації додатку у Google Play (хоча б у Internal testing).

---

## 7. React Native 0.73.6 — сумісність — вердикт: ОК

| Компонент | Сумісність |
|---|---|
| Kotlin 1.8.0 | ✅ Підтримується RN 0.73 |
| Gradle 8.3 | ✅ Підтримується RN 0.73 |
| AGP 8.1.1 | ✅ Підтримується RN 0.73 |
| Fabric (New Architecture) | ✅ Увімкнено через `MainActivity.java` |
| Hermes | ✅ Увімкнено |
| Flipper | ✅ Ініціалізується в `MainApplication.java` |

**Примітка:** RN 0.73.x вже не підтримується (EOL). Для довгострокової підтримки рекомендується оновлення до 0.74+ або 0.75+.

---

## 8. MainActivity.java / MainApplication.java — вердикт: ОК

- `super.onCreate(null)` для react-native-screens ✅
- New Architecture entry point ✅
- Hermes enabled через `BuildConfig.IS_HERMES_ENABLED` ✅
- Flipper ініціалізація ✅

---

## 9. Додаткові зауваження

### 9.1 Gradle Wrapper
`gradle-wrapper.properties` → `gradle-8.3-all.zip` — ОК для RN 0.73, але `bin` замість `all` прискорить CI:
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.3-bin.zip
```

### 9.2 Dependencies у package.json
Деякі залежності вже застаріли:
- `@react-navigation/native` 6.x → можна оновити до 7.x
- `react-native-screens` 3.30 → оновити до 3.29+ (чи сумісна з RN 0.73)
- `react-native-vector-icons` — потребує лінкування шрифтів у `android/app/src/main/assets/fonts`

---

## Зведена таблиця блокерів та рекомендацій

| # | Проблема | Рівень | Дія |
|---|---|---|---|
| 1 | `google-services.json` — placeholder | **КРИТИЧНИЙ** | Отримати з Firebase Console, додати в `.gitignore` |
| 2 | `enableProguardInReleaseBuilds` не визначена | **КРИТИЧНИЙ** | Додати у `gradle.properties` або замінити на `true` |
| 3 | Release підписується debug.keystore | **КРИТИЧНИЙ** | Створити production signing config |
| 4 | Firebase App Check не активовано в JS | **КРИТИЧНИЙ** | Додати код активації в `src/` |
| 5 | `targetSdkVersion` = 34 | **ВИСОКИЙ** | Підняти до 35 |
| 6 | ProGuard порожній | **СРЕДНІЙ** | Додати keep-правила |
| 7 | AndroidManifest без FileProvider | **СРЕДНІЙ** | Додати FileProvider для SDK 24+ |
| 8 | RN 0.73.6 EOL | **НИЗЬКИЙ** | Запланувати оновлення до 0.75+ |
| 9 | `firebase-appcheck-playintegrity` без версії | **НИЗЬКИЙ** | Додати BOM |

---

**Висновок:** Android-частина має базову структуру React Native 0.73 з увімкненою New Architecture, але **4 критичних блокери** перешкоджають production build та Firebase інтеграції. Рекомендується виправити блокери перед наступним релізом.
