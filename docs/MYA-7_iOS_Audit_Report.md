# MYA-7: Аудит iOS-налаштувань та Xcode-проєкту LexTrack

**Дата аудиту:** 2026-06-13
**Аудитор:** iOS Developer
**Версія React Native:** 0.73.6
**Платформа:** iOS (CocoaPods + Xcode)

---

## 1. Podfile — Аналіз

**Файл:** `ios/Podfile`

### Знайдені проблеми:

| # | Проблема | Серйозність | Опис |
|---|----------|-------------|------|
| 1.1 | Використання Flipper | HIGH | Flipper DEPRECATED у React Native 0.73+. Залишається `flipper_config = FlipperConfiguration.enabled` за замовчуванням. При збірці з `NO_FLIPPER=1` працює, але за замовчуванням підтягує застарілі залежності. |
| 1.2 | Відсутні Firebase CocoaPods | MEDIUM | У Podfile немає явного `pod 'Firebase/Analytics'`, `pod 'Firebase/Messaging'` тощо. Firebase залежить лише від autolinking через `use_native_modules!`. Це ризиковано для production. |
| 1.3 | Відсутній `use_modular_headers!` | LOW | Для деяких Firebase pods може знадобитись modular headers — варто перевірити при збірці. |

### Рекомендації:
```ruby
# Додати явно у target 'LexTrack':
pod 'Firebase/Core'
pod 'Firebase/Messaging'
pod 'Firebase/Analytics'

# Видалити або закоментувати Flipper:
# flipper_config = ENV['NO_FLIPPER'] == "1" ? FlipperConfiguration.disabled : FlipperConfiguration.enabled
```

---

## 2. Xcode Project (project.pbxproj) — Аналіз

**Файл:** `ios/LexTrack.xcodeproj/project.pbxproj`

### Знайдені проблеми:

| # | Проблема | Серйозність | Опис |
|---|----------|-------------|------|
| 2.1 | `IPHONEOS_DEPLOYMENT_TARGET = 13.4` | MEDIUM | Для RN 0.73 це мінімум, але Apple вже вимагає iOS 15+ для нових додатків (з 2024). Рекомендується підняти до 15.0+. |
| 2.2 | Відсутній `DEVELOPMENT_TEAM` | HIGH | У pbxproj немає `DEVELOPMENT_TEAM` — це означає, що signing треба налаштовувати вручну в Xcode кожного разу. Для CI/CD критично. |
| 2.3 | `CODE_SIGN_IDENTITY = "iPhone Developer"` | MEDIUM | Це generic identity. Для production потрібен "iPhone Distribution" або автоматичний signing. |
| 2.4 | Bundle ID `com.lextrack` | OK | Простий bundle ID, правильний формат. |

### Рекомендації:
- Додати `DEVELOPMENT_TEAM` у build settings (Xcode → Signing & Capabilities)
- Підняти `IPHONEOS_DEPLOYMENT_TARGET` до 15.0
- Налаштувати Automatic signing або додати provisioning profiles для CI

---

## 3. Info.plist — Аналіз

**Файл:** `ios/LexTrack/Info.plist`

### Знайдені проблеми (КРИТИЧНІ):

| # | Проблема | Серйозність | Опис |
|---|----------|-------------|------|
| 3.1 | `CFBundleDisplayName = "Hello App Display Name"` | **CRITICAL** | Залишився з шаблону React Native! App Store відхилить або покаже неправильну назву. МАЄ БУТИ "LexTrack". |
| 3.2 | `NSLocationWhenInUseUsageDescription = ""` (порожнє) | **HIGH** | Для геолокації (якщо додаток її використовує) потрібен опис причини. Apple відхилить без опису. |
| 3.3 | `UIRequiredDeviceCapabilities = armv7` | MEDIUM | armv7 — дуже старе (iPhone 5 era). Сучасні пристрої arm64. Це може блокувати нові пристрої. |
| 3.4 | Landscape орієнтації | LOW | Підтримує `LandscapeLeft` та `LandscapeRight`. Для юридичного/документного додатка краще lock до Portrait, щоб уникнути проблем з layout. |
| 3.5 | `NSAllowsArbitraryLoads = false` | OK | Правильно — не змінювати, інакше App Store відхилить. |
| 3.6 | `NSAllowsLocalNetworking = true` | OK | Потрібно для metro bundler у розробці. |

### Рекомендації:
```xml
<!-- Виправити: -->
<key>CFBundleDisplayName</key>
<string>LexTrack</string>

<!-- Додати (якщо використовується геолокація): -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>LexTrack використовує ваше місцезнаходження для фіксації координат юридичних об'єктів</string>

<!-- Оновити: -->
<key>UIRequiredDeviceCapabilities</key>
<array>
    <string>arm64</string>
</array>
```

---

## 4. AppDelegate.mm — Аналіз

**Файл:** `ios/LexTrack/AppDelegate.mm`

### Знайдені проблеми:

| # | Проблема | Серйосність | Опис |
|---|----------|-------------|------|
| 4.1 | Старий RN API — `[super application:...]` | LOW | У React Native 0.73 це ще працює, але для новіших версій (`0.74+`) потрібен новий API з `RCTAppDelegate`. Поки що не блокує, але при оновленні RN буде проблема. |
| 4.2 | Firebase App Check налаштування | OK | Правильно: DebugProvider для DEBUG, DeviceCheckProvider для RELEASE. |
| 4.3 | `self.moduleName = @"LexTrack"` | OK | Правильно відповідає назві додатка. |
| 4.4 | Bundle URL logic | OK | Правильно: RCTBundleURLProvider для debug, main.jsbundle для release. |

### Firebase App Check (DeviceCheck) — Детальний аналіз:
- **Налаштування в коді:** Коректне (`FIRDeviceCheckProviderFactory` для release)
- **АЛЕ** для DeviceCheck потрібен:
  1. Apple Developer Account ($99/рік)
  2. Увімкнений DeviceCheck у Apple Developer Portal
  3. Правильний `GoogleService-Info.plist` з дійсними ключами
- **Поточний стан:** Без справжнього plist DeviceCheck НЕ працюватиме

---

## 5. LaunchScreen.storyboard — Аналіз

**Файл:** `ios/LexTrack/LaunchScreen.storyboard`

### Знайдені проблеми:

| # | Проблема | Серйосність | Опис |
|---|----------|-------------|------|
| 5.1 | Старий `toolsVersion="15702"` | LOW | Xcode 11.x tools — застаріле. Потрібно відкрити в сучасному Xcode та зберегти. |
| 5.2 | Відсутні branding assets | MEDIUM | Тільки текст "LexTrack" без логотипу/брендингу. Для App Store потрібен професійний splash screen. |
| 5.3 | `Powered by React Native` текст | LOW | Для production варто видалити або замінити на copyright компанії. |

---

## 6. GoogleService-Info.plist — КРИТИЧНИЙ АНАЛІЗ

**Файл:** `ios/LexTrack/GoogleService-Info.plist`

### Статус: **PLACEHOLDER — НЕ ПРАЦЮЄ**

```xml
<key>GOOGLE_APP_ID</key>
<string>1:PLACEHOLDER:ios:PLACEHOLDER</string>
```

### Знайдені проблеми (КРИТИЧНІ):

| # | Проблема | Серйосність | Опис |
|---|----------|-------------|------|
| 6.1 | `GOOGLE_APP_ID = PLACEHOLDER` | **CRITICAL** | Firebase НЕ ІНІЦІАЛІЗУЄТЬСЯ без дійсного GOOGLE_APP_ID. Додаток впаде при старті або Firebase-функції не працюватимуть. |
| 6.2 | Всі сервіси `IS_*_ENABLED = false` | **HIGH** | Analytics, Messaging, Sign-in — все вимкнено. Навіть з правильним plist сервіси не працюватимуть. |
| 6.3 | Відсутній `API_KEY`, `CLIENT_ID` | **CRITICAL** | Ці ключі обов'язкові для Firebase SDK. |

### Дії для виправлення:
1. Зайти в Firebase Console: https://console.firebase.google.com/project/lextrack-80605/settings/general/ios:com.lextrack
2. Завантажити справжній `GoogleService-Info.plist`
3. Замінити placeholder-файл
4. Увімкнути необхідні сервіси у plist або через Firebase Console

---

## 7. Відсутні критичні файли

### 7.1 Privacy Manifest (`PrivacyInfo.xcprivacy`)
- **Статус:** ВІДСУТНІЙ
- **Серйосність:** **CRITICAL** (з 2024 Apple ОБОВ'ЯЗКОВО вимагає для всіх додатків)
- **Опис:** З 2024 року Apple вимагає `PrivacyInfo.xcprivacy` для всіх додатків. Відсутність = відхилення App Store Review.
- **Рішення:** Створити `ios/LexTrack/PrivacyInfo.xcprivacy` з переліком зібраних даних.

### 7.2 Entitlements файл (`LexTrack.entitlements`)
- **Статус:** ВІДСУТНІЙ
- **Серйосність:** MEDIUM
- **Опис:** Потрібен для Push Notifications, App Groups, Keychain Sharing тощо.
- **Рішення:** Створити при налаштуванні Push Notifications.

### 7.3 Assets.xcassets / AppIcon
- **Статус:** Мінімальний
- **Серйосність:** MEDIUM
- **Опис:** Є `Images.xcassets` але потрібен повний набір AppIcon для всіх розмірів.

---

## 8. Підсумкова таблиця блокерів

| Блокер | Серйосність | Вплив | Відповідальний |
|--------|-------------|-------|----------------|
| `CFBundleDisplayName` — шаблонна назва | **CRITICAL** | App Store відхилення | iOS Developer |
| `GoogleService-Info.plist` — placeholder | **CRITICAL** | Firebase не працює | Firebase Admin / CEO |
| Відсутній `PrivacyInfo.xcprivacy` | **CRITICAL** | App Store відхилення (з 2024) | iOS Developer |
| Відсутній `DEVELOPMENT_TEAM` | HIGH | CI/CD та signing не працюють | DevOps / iOS Developer |
| `NSLocationWhenInUseUsageDescription` — порожній | HIGH | App Store відхилення (якщо геолокація) | iOS Developer |
| `IPHONEOS_DEPLOYMENT_TARGET = 13.4` | MEDIUM | Застаріла цільова платформа | iOS Developer |
| Flipper — deprecated | MEDIUM | Застарілі залежності | iOS Developer |
| `armv7` — старий архітектура | MEDIUM | Може блокувати нові пристрої | iOS Developer |

---

## 9. Рекомендований порядок виправлень

1. **Негайно (блокують реліз):**
   - Виправити `CFBundleDisplayName` → "LexTrack"
   - Отримати справжній `GoogleService-Info.plist` з Firebase Console
   - Створити `PrivacyInfo.xcprivacy`
   - Додати `DEVELOPMENT_TEAM`

2. **Пріоритетно (до першого білду):**
   - Видалити Flipper, додати Firebase CocoaPods явно
   - Додати `NSLocationWhenInUseUsageDescription`
   - Підняти deployment target до 15.0
   - Оновити `UIRequiredDeviceCapabilities` → arm64

3. **Оптимізація:**
   - Оновити LaunchScreen.storyboard (Xcode 15+)
   - Додати брендинг
   - Створити entitlements для майбутніх фіч

---

*Звіт підготовлено iOS Developer для MYA-7*
