# LexTrack — Інструкція для розробників

> Короткий посібник із налаштування середовища розробки LexTrack v2.

---

## 1. Передумови

| Інструмент | Мінімальна версія | Примітка |
|------------|-------------------|----------|
| Node.js | `>= 18` | Рекомендовано LTS |
| JDK | 17 | Android-сборка |
| Android SDK | API 23–34 | `platforms;android-34`, `build-tools;34.0.0` |
| React Native CLI | остання | `npm install -g react-native-cli` |
| Firebase CLI | остання | Для Cloud Functions |
| Git | остання | — |

---

## 2. Швидкий старт

### 2.1 Клонування та встановлення

```bash
git clone https://github.com/LukashEvgen/abapp.git
cd abapp
npm install
```

### 2.2 Firebase налаштування

1. Отримайте доступ до **Firebase Console** (попросіть власника проєкту).
2. Завантажте `google-services.json` → `android/app/`.
3. Увімкніть у Firebase Console:
   - **Authentication** (Phone OTP)
   - **Firestore Database**
   - **Cloud Storage**
   - **Cloud Messaging**
4. Розгорніть `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Додайте себе як адміна:
   - Firebase Auth → Add user (Phone).
   - Firestore → `lawyers/{uid}` з полями `name`, `phone`, `role: 'admin'`.

> ⚠️ Файл `google-services.json` **не комітьте** в репозиторій — він уже в `.gitignore`.

### 2.3 Запуск

```bash
npm start        # Metro bundler
npm run android  # Android (потрібен емулятор або пристрій)
```

---

## 3. Структура кодової бази

```
src/
├── App.js                    # Кореневий компонент
├── context/
│   └── AuthContext.js        # Глобальний стан авторизації
├── navigation/
│   └── AppNavigator.js       # Stack + Bottom Tabs роутинг
├── screens/
│   ├── client/               # 11 екранів клієнта
│   ├── admin/                # 6 екранів адміністратора
│   └── shared/
│       └── LoginScreen.js
├── services/
│   └── firebase.js           # Всі CRUD-операції через Firebase
├── components/shared/
│   └── UIComponents.js       # 12 дизайн-компонентів
├── utils/
│   ├── theme.js              # Тема, токени, глобальні стилі
│   └── helpers.js            # Форматування, валідація, статуси
└── styles/
    └── chatStyles.js         # Стилі чату
```

---

## 4. Дизайн-система v2

### 4.1 Токени

Єдине джерело правди — `design/tokens.json`.

Програмний шар — `src/utils/theme.js`, який експортує:
- `colors` — палітра (bg, text, brand, semantic)
- `spacing` — 4-px grid
- `radius` — border radius
- `typography` — font sizes, line-heights, weights
- `shadows` — elevation + shadowOffset
- `globalStyles` — зручні комбінації

### 4.2 Правила написання стилів

❌ **Не використовуйте hardcoded значення:**
```js
// Погано
fontSize: 14,
fontWeight: '600',
backgroundColor: '#41A9A5',
borderRadius: 10,
```

✅ **Використовуйте токени:**
```js
// Добре
import { typography, spacing, colors, radius } from '../utils/theme';

fontSize: typography.h3.size,
fontWeight: typography.h3.weight,
backgroundColor: colors.brand,
borderRadius: radius.lg,
```

### 4.3 Компоненти

Перед створенням нового UI — перевірте `UIComponents.js`. Ймовірно, потрібний компонент уже існує:

| Компонент | Використання |
|-----------|--------------|
| `Badge` | Статус, ризик |
| `GoldButton` | Основна CTA |
| `Card` | Контейнер з кліком |
| `SectionLabel` | Заголовок секції |
| `Input` | Текстове поле |
| `AlertBanner` | Горизонтальний алерт |
| `StatCard` | Число + підпис |
| `Avatar` | Ініціали в колі |
| `LoadingScreen` | Індикатор завантаження |
| `EmptyState` | Порожній стан |
| `ProgressBar` | Горизонтальний прогрес |

---

## 5. Тестування

### 5.1 Запуск тестів

```bash
npm test              # Jest з покриттям
npm run test:rules    # Firestore Rules unit tests
```

### 5.2 Що тестується

| Файл | Мінімальне покриття |
|------|---------------------|
| `src/utils/helpers.js` | 80 % (branches, functions, lines, statements) |
| `src/utils/theme.js` | реєструється в collectCoverageFrom |
| `src/context/AuthContext.js` | реєструється в collectCoverageFrom |

### 5.3 Додавання нового тесту

```bash
# Тести поруч із кодом або в __tests__/
# Приклад: src/utils/__tests__/newHelper.test.js
```

---

## 6. Як додати новий екран

1. **Створіть файл** у відповідній папці (`screens/client/` або `screens/admin/`).
2. **Використовуйте токени** для всіх стилів.
3. **Додайте навігацію** в `AppNavigator.js` (Stack або BottomTab).
4. **Підключіть Firebase** через відповідний сервіс (`services/clients.ts`, `services/cases.ts`, `services/documents.ts` тощо), а не через `services/firebase.js` (не пишіть raw Firebase-код на екрані).
5. **Додайте тести** за потреби.

---

## 7. Контакти

Питання щодо архітектури — [@Технічний директор](agent://37a93a99-51cd-4e7d-ae76-780d5828bec8)  
Питання щодо фронтенду — [@Frontend-разробник](agent://6c83d36c-206f-4ae7-a48b-6f07cf6f1516)
