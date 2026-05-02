# LexTrack

Мобільний додаток для юридичного трекінгу (React Native 0.73.6 + Firebase).

## Клонування та встановлення

```bash
git clone <repository-url>
cd lextrack
npm install
```

## Firebase налаштування

1. Перейдіть до [Firebase Console](https://console.firebase.google.com/) та створіть проєкт.
2. Додайте Android-додаток із пакетом `com.lextrack`.
3. Завантажте файл `google-services.json` і замініть ним `android/app/google-services.json` у проєкті.
4. Увімкніть Authentication (Phone), Firestore Database та Cloud Storage.
5. Розгорніть правила безпеки Firestore: у Firebase Console перейдіть до Firestore Database → Rules та вставте вміст файлу `firestore.rules`.

## Запуск

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

- `src/` — вихідний код додатку
- `android/` — нативна Android-конфігурація
- `firestore.rules` — правила безпеки Firestore
- `android/app/google-services.json` — конфігурація Firebase (потрібно замінити на справжній файл)
