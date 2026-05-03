# LexTrack

Мобільний додаток для юридичного трекінгу на базі **React Native 0.73.6** та **Firebase**.

LexTrack дозволяє юристам керувати клієнтами, справами, документами та рахунками, а клієнтам — відстежувати свої справи, переглядати документи, рахунки та спілкуватися з адвокатом.

## Зміст

- [Функціонал](#функціонал)
- [Клонування та встановлення](#клонування-та-встановлення)
- [Firebase налаштування](#firebase-налаштування)
- [Запуск](#запуск)
- [Структура проєкту](#структура-проєкту)
- [Ролі користувачів](#ролі-користувачів)
- [Документація](#документація)
- [Ліцензія](#ліцензія)

## Функціонал

- **Аутентифікація** — вхід за номером телефону через Firebase Authentication.
- **Розділення ролей** — два типи користувачів: адміністратор (юрист) та клієнт.
- **Управління справами** — створення, перегляд та оновлення статусів справ.
- **Документи** — завантаження та перегляд документів.
- **Рахунки** — створення рахунків адміністратором та перегляд клієнтом.
- **Перевірки** — перевірки (інспекції) з деталізацією.
- **Реєстри** — пошук та робота з реєстрами.
- **Бюро кредитних історій** — перевірка кредитних історій.
- **Чат** — обмін повідомленнями між адміністратором та клієнтом.
- **Push-повідомлення** — інтеграція з Firebase Cloud Messaging.

## Клонування та встановлення

### Вимоги

- Node.js `>= 18`
- Java Development Kit (JDK) 17
- Android SDK (для Android-сборки)
- React Native CLI

### Встановлення залежностей

```bash
git clone <repository-url>
cd lextrack
npm install
```

## Firebase налаштування

1. Перейдіть до [Firebase Console](https://console.firebase.google.com/) та створіть проєкт.
2. Додайте Android-додаток із пакетом `com.lextrack`.
3. Завантажте файл `google-services.json` і замініть ним `android/app/google-services.json` у проєкті.
4. Увімкніть в Firebase Console:
   - **Authentication** (метод: Phone)
   - **Firestore Database**
   - **Cloud Storage**
   - **Cloud Messaging** (для push-сповіщень)
5. Розгорніть правила безпеки Firestore: перейдіть до Firestore Database → Rules та вставте вміст файлу `firestore.rules`.

> **Примітка:** Файл `android/app/google-services.json` не повинен потрапляти у публічний репозиторій. Він вже доданий до `.gitignore`.

### Firebase App Check

1. **Android — Play Integrity API (prod)**
   - Отримайте SHA-256 fingerprint вашого підпису:
     ```bash
     keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
     ```
     Або для релізного ключа:
     ```bash
     keytool -list -v -keystore <шлях-до-release.keystore> -alias <alias> -storepass <пароль>
     ```
   - Перейдіть у **Firebase Console → Project settings → App Check** та виберіть додаток `com.lextrack`.
   - Увімкніть **Play Integrity API**, вставте SHA-256 fingerprint та збережіть.

2. **iOS — DeviceCheck (prod)**
   - У **Firebase Console → App Check** виберіть iOS-додаток.
   - Увімкніть **DeviceCheck** (потрібен Apple Developer Account та налаштований ключ).

3. **iOS налаштування**
    - Переконайтеся, що файл `ios/LexTrack/GoogleService-Info.plist` додано до проєкту Xcode (поза git; вже в `.gitignore`).
    - У `ios/LexTrack/AppDelegate.mm` автоматично обрано `FIRDeviceCheckProviderFactory` (prod) або `FIRAppCheckDebugProviderFactory` (dev) залежно від `#if DEBUG`. Якщо ви редагуєте вручну, переконайтеся, що `[FIRApp configure]` відбувається перед `[FIRAppCheck setAppCheckProviderFactory:…]`.
   - **Android:** при першому запуску в debug-режимі в логах з’явиться `DebugAppCheckToken`. Скопіюйте його та додайте у **Firebase Console → App Check → Manage debug tokens**.
   - **iOS:** у консолі Xcode в debug-режимі з’явиться аналогічний токен. Додайте його у тому ж розділі Firebase Console.

4. **Cloud Functions**
   - Усі callable-функції в `functions/src/index.ts` використовують `enforceAppCheck: true` та перевіряють `context.app != null`, повертаючи `failed-precondition` для запитів без дійсного App Check token.
   - Для HTTPS `onRequest` функцій перевіряється заголовок `X-Firebase-AppCheck`.
   - Детальна довідка з налаштування: [`docs/FIREBASE_APP_CHECK_SETUP.md`](docs/FIREBASE_APP_CHECK_SETUP.md).

> **⚠️ Не деплоюйте на production без схвалення CTO.** Переконайтеся, що SHA-256 релізного ключа додано у Firebase Console та debug-токени видалені/неактивні для prod.

## Запуск

### Скрипти

| Скрипт | Призначення |
|--------|-------------|
| `npm start` | Запуск Metro bundler |
| `npm run android` | Запуск Android-додатку (потрібен емулятор або пристрій) |
| `npm run ios` | Запуск iOS-додатку (доступно лише на macOS) |
| `npm test` | Запуск тестів Jest |
| `npm run lint` | Перевірка коду ESLint |

### Metro bundler

```bash
npm start
```

### Android (потрібен емулятор або пристрій)

```bash
npm run android
```

Або вручну через Gradle:

```bash
cd android
./gradlew assembleDebug
```

## Структура проєкту

```
├── android/                        # Нативна Android-конфігурація
├── src/                            # Вихідний код додатку
│   ├── App.js                      # Кореневий компонент додатку
│   ├── components/shared/          # Спільні UI-компоненти
│   ├── context/                    # React Context (AuthContext)
│   ├── navigation/                 # Навігація (стекові та таб-навігатори)
│   ├── screens/
│   │   ├── admin/                  # Екрани для адміністратора (юриста)
│   │   │   ├── AdminDashboard.js
│   │   │   ├── ClientsList.js
│   │   │   ├── AdminClientDetail.js
│   │   │   ├── AdminCaseDetail.js
│   │   │   ├── CreateInvoice.js
│   │   │   └── AdminChat.js
│   │   ├── client/                 # Екрани для клієнта
│   │   │   ├── ClientDashboard.js
│   │   │   ├── MyCases.js
│   │   │   ├── CaseDetail.js
│   │   │   ├── MyDocuments.js
│   │   │   ├── ScannerScreen.js
│   │   │   ├── MyInvoices.js
│   │   │   ├── MyInspections.js
│   │   │   ├── InspectionDetail.js
│   │   │   ├── RegistrySearch.js
│   │   │   ├── BureauScreen.js
│   │   │   └── ChatScreen.js
│   │   └── shared/                 # Спільні екрани
│   │       └── LoginScreen.js
│   ├── services/                   # Сервіси (Firebase ініціалізація)
│   └── utils/                      # Утиліти, теми, хелпери
├── firestore.rules                 # Правила безпеки Firestore
├── package.json
├── metro.config.js
├── babel.config.js
└── index.js
```

## Ролі користувачів

### Адміністратор (юрист)

- Перегляд головної панелі
- Управління списком клієнтів
- Перегляд деталей клієнта та його справ
- Створення рахунків
- Комунікація через чат

### Клієнт

- Перегляд особистої панелі
- Перегляд своїх справ та їх деталей
- Перегляд документів та сканування
- Перегляд рахунків
- Перегляд перевірок (інспекцій)
- Пошук у реєстрах
- Перевірка кредитних історій через бюро
- Комунікація через чат з юристом

## Документація

| Документ | Опис |
|----------|------|
| [`docs/FIREBASE_APP_CHECK_SETUP.md`](docs/FIREBASE_APP_CHECK_SETUP.md) | Повний гайд налаштування Firebase App Check (Play Integrity, DeviceCheck, debug tokens, verify checklist) |
| [`docs/LexTrack-v2-TZ.md`](docs/LexTrack-v2-TZ.md) | Повне технічне завдання LexTrack v2 (архітектура, стек, вимоги, план) |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Інструкція для розробників (налаштування середовища, дизайн-система, тестування) |
| [`CHANGELOG.md`](CHANGELOG.md) | Історія змін та версіонування |
| [`design/tokens.json`](design/tokens.json) | Design tokens (Palette V2) |
| [`firestore.rules`](firestore.rules) | Правила безпеки Firestore |

## Ліцензія

Цей проєкт є приватним та призначений для внутрішнього використання.
