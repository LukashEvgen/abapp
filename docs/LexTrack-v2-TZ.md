# LexTrack v2 — Технічне завдання

**Версія документа:** 2.1  
**Дата:** травень 2026  
**Платформа:** Android + iOS (React Native 0.73.6)  
**Репозиторій:** [abapp](https://github.com/LukashEvgen/abapp)  
**Замовник:** АБ Лукашенко  
**Статус:** у розробці (декомпозиція на 9 епіків)  

---

## 1. Загальний опис продукту

### 1.1 Призначення

LexTrack — мобільний додаток адвокатського бюро Євгена Лукашенка, що поєднує публічні юридичні інструменти (моніторинг справ, перевірки, пошук по реєстрах) із приватним клієнтським кабінетом (справи, документи, рахунки, чат).

### 1.2 Цільова аудиторія

| Категорія | Опис |
|-----------|------|
| Фізичні особи | Учасники судових справ, громадяни під перевірками |
| ФОП і малий бізнес | Підприємці, що отримали перевірки ДПС, АМКУ, Держпраці |
| Клієнти бюро | Діючі клієнти з доступом до приватного кабінету |
| Адвокат | Євген Лукашенко — адміністратор системи |

### 1.3 Конкурентні переваги

- Безкоштовний трекер держорганів (ДПС, АМКУ, ЄДРСР, ЄДР)
- Клієнтський кабінет від конкретного бюро (не маркетплейс)
- PDF-сканер із завантаженням документів адвокату
- Real-time чат з адвокатом всередині додатку

---

## 2. Технологічний стек

| Компонент | Технологія / Версія | Призначення |
|-----------|---------------------|-------------|
| Фреймворк | React Native 0.73.6 | Android + iOS (фаза 2) з одного коду |
| Авторизація | Firebase Auth (Phone OTP) | SMS-вхід без паролю |
| База даних | Firebase Firestore | Real-time NoSQL |
| Файлове сховище | Firebase Storage | PDF, документи |
| Push | Firebase Cloud Messaging (FCM) | Події, засідання, рахунки |
| Навігація | React Navigation 6.x | Stack + Bottom Tabs |
| Вибір файлів | react-native-document-picker | PDF, Word, зображення |
| Камера/Галерея | react-native-image-picker | Сканування документів |
| Градієнти | react-native-linear-gradient | UI-акценти |
| Дати | date-fns 3.x (uk locale) | Форматування українською |

### 2.1 Вимоги до пристрою

- Android 6.0 (API 23) та вище
- RAM: від 2 ГБ (~60–80 МБ під додаток)
- Диск: від 150 МБ
- Інтернет: обов'язковий (Firebase)

---

## 3. Архітектура додатку

### 3.1 Файлова структура (`src/`)

```
src/
├── App.js                          # Кореневий компонент (SafeAreaProvider + AuthProvider)
├── context/
│   └── AuthContext.js              # Глобальний стан: user, isLawyer, loginWithPhone, confirmCode, logout
├── navigation/
│   └── AppNavigator.js             # Роутинг: клієнт / адмін / логін
├── screens/
│   ├── client/                     # 11 екранів для клієнта
│   │   ├── ClientDashboard.js
│   │   ├── MyCases.js
│   │   ├── CaseDetail.js
│   │   ├── MyDocuments.js
│   │   ├── ScannerScreen.js
│   │   ├── MyInvoices.js
│   │   ├── MyInspections.js
│   │   ├── InspectionDetail.js
│   │   ├── RegistrySearch.js
│   │   ├── BureauScreen.js
│   │   └── ChatScreen.js           # (shared фізично, клієнтський режим)
│   ├── admin/                      # 6 екранів для адвоката
│   │   ├── AdminDashboard.js
│   │   ├── ClientsList.js
│   │   ├── AdminClientDetail.js
│   │   ├── AdminCaseDetail.js
│   │   ├── CreateInvoice.js
│   │   └── AdminChat.js
│   └── shared/
│       ├── LoginScreen.js
│       └── ChatScreen.js           # Спільний чат (from: client | lawyer)
├── services/
│   └── firebase.js                 # Вся логіка Firebase: CRUD, чат, завантаження
├── components/shared/
│   └── UIComponents.js             # Дизайн-система: 12 компонентів
├── utils/
│   ├── theme.js                    # Кольори, spacing, radius, typography, shadows, globalStyles
│   └── helpers.js                  # Форматування дат, сум, статусів, валідація
└── styles/
    └── chatStyles.js               # Стилі чату (bubble, input, send)
```

### 3.2 Структура бази даних Firestore

```
lawyers/{uid}                       # Адвокати (адміни)
  name, email, phone, role

clients/{clientId}                  # Клієнти бюро
  name, phone, email, status, createdAt

  clients/{id}/cases/{caseId}       # Судові справи
    title, caseNumber, court, category, instance
    status, progress (0–100), nextHearing, createdAt

    .../cases/{id}/events/{eventId} # Хронологія подій
      text, actor (lawyer|court|other), date

    .../cases/{id}/documents/{docId}# Файли справи
      name, size, type, url, storagePath, uploadedAt

    .../cases/{id}/invoices/{invId}# Рахунки
      description, amount, status, dueDate, paidAt

  clients/{id}/inspections/{inspId}# Перевірки
    organ, type, subject, dateStart, dateEnd, risk, status

  clients/{id}/messages/{msgId}    # Чат
    text, from (lawyer|client), timestamp, read

inquiries/{id}                      # Публічні звернення
  name, phone, service, message, status, createdAt
```

### 3.3 Правила безпеки (`firestore.rules`)

- **Клієнт** читає лише власні дані (`auth.uid == clientId`).
- **Адвокат** (запис у `lawyers/{uid}`) має доступ до всіх клієнтів.
- **Публічна форма** (`inquiries`) дозволяє запис без авторизації (`isValidInquiryCreate`).
- Видалення заборонено для всіх ролей (захист від помилок).
- Розмір документа при записі ≤ 512 КБ (`isDocSizeValid`).

---

## 4. Система авторизації

### 4.1 Логіка ролей

| Роль | Умова | Доступ |
|------|-------|--------|
| Незалогінений | `!user` | `LoginScreen` |
| Клієнт | `user` + відсутність у `lawyers/{uid}` | `ClientTabs` (5 вкладок) |
| Адвокат | `user` + наявність у `lawyers/{uid}` | `AdminTabs` (3 вкладки) |

### 4.2 Процес входу

1. Адвокат реєструє клієнта в адмін-панелі (ПІБ + телефон).
2. Клієнт відкриває додаток → вводить номер телефону.
3. Firebase надсилає SMS із 6-значним кодом.
4. Клієнт вводить код → автоматична авторизація.
5. `AuthContext` перевіряє наявність UID у колекції `lawyers`.
6. Перенаправлення: Клієнт → `ClientTabs`, Адвокат → `AdminTabs`.

> Самореєстрація неможлива. Доступ тільки якщо телефон попередньо внесено адвокатом.

---

## 5. Дизайн-система v2 (Palette V2)

### 5.1 Джерело правди

- `design/tokens.json` — єдине джерело токенів (кольори, типографіка, spacing, radius, shadows).
- `src/utils/theme.js` — програмний шар: експортує `colors`, `spacing`, `radius`, `typography`, `shadows`, `globalStyles`. Зберігає legacy flat-ключі (`colors.bg`, `colors.text`, …) для сумісності.
- `design/palette-v2-preview.html` — інтерактивний перегляд палітри.
- `design/mockups-preview.html` — галерея PNG-мокапів усіх екранів.
- `design/mockups/` — canonical PNG-екрани.

### 5.2 Кольорова палітра

| Роль | Значення | Використання |
|------|----------|--------------|
| Brand Primary | `#41A9A5` | CTA, акценти, активні стани |
| Brand Light | `#68C4C0` | Hover/press |
| Brand Dark | `#2E8582` | Тіні, глибина |
| Brand Muted | `rgba(65,169,165,0.15)` | Фони банерів |
| Semantic Success | `#3CB46E` | Позитивні статуси |
| Semantic Warning | `#E6A03C` | Увага, pending |
| Semantic Danger | `#DC4B4B` | Помилки, критичне |
| Semantic Info | `#4696DC` | Сповіщення, hints |
| Neutral 0 | `#FFFFFF` | Текст primary (inverse) |
| Neutral 50 | `#F0F1F2` | Текст primary |
| Neutral 300 | `#8A9496` | Текст secondary |
| Neutral 500 | `#505C5E` | Текст disabled |
| Neutral 800 | `#1E2324` | Border subtle |
| Neutral 900 | `#161A1B` | Surface raised (картки) |
| Neutral 950 | `#101314` | Surface base |
| Neutral 1000 | `#0A0D0E` | Background |

Кожен semantic колір має `Bg`-аналог (14 % opacity) для банерів і бейджів.

### 5.3 Типографіка

| Token | Size | Line-height | Використання |
|-------|------|-------------|--------------|
| `h1` | 28 | 33.6 | Найвищий рівень сторінки |
| `h2` | 22 | 28.6 | Секційні заголовки |
| `h3` | 18 | 27 | Картки, форми |
| `body` | 14 | 21 | Основний текст |
| `caption` | 12 | 18 | Метадані, підписи |
| `label` | 11 | 13.2 | Uppercase labels, tags |

Фундамент unit = 4 px. Розміри шрифтів: `11 / 12 / 14 / 16 / 18 / 22 / 28 / 34`.

### 5.4 Spacing

Unit = 4 px. Scale: `0 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64`.
Legacy alias: `xs=4`, `sm=8`, `md=16`, `lg=24`, `xl=32`.

### 5.5 Radius і Shadows

- **Radius**: 6 / 10 / 16 / 24 / 9999 (full).
- **Shadows**: 0–3 рівні з `elevation` (Android) та `shadowOffset/Radius` (iOS) для паритету.

### 5.6 Спільні компоненти (`UIComponents.js`)

| Компонент | Опис |
|-----------|------|
| `Badge` | Бейдж статусу з кольоровою крапкою та фоном (`statusColors` / `statusBgColors`) |
| `GoldButton` | Основна кнопка: `filled` / `ghost` / `small` / `disabled` / `loading` |
| `Card` | Картка з опціональним `onPress` (TouchableOpacity) |
| `SectionLabel` | Заголовок секції: gold, uppercase, letter-spacing |
| `Input` | Текстове поле з `placeholderTextColor` |
| `AlertBanner` | Горизонтальний алерт із типом (`danger` / `warning` / `gold` / `success`) та стрілкою |
| `StatCard` | Картка статистики з іконкою, числом та підписом |
| `Avatar` | Коло з ініціалами (із `helpers.initials`) |
| `LoadingScreen` | Центрований `ActivityIndicator` gold |
| `EmptyState` | Порожній стан: іконка + заголовок + підзаголовок |
| `ProgressBar` | Горизонтальний прогрес-бар із кольором і висотою |

---

## 6. Навігаційна структура

### 6.1 Клієнтська навігація

Bottom Tabs (5 вкладок):

- **Home** → `ClientDashboard`
- **Cases** → `ClientCasesStack`
  - `MyCases`
  - `CaseDetail`
  - `MyDocuments`
  - `ScannerScreen`
  - `MyInvoices`
  - `ChatScreen`
- **Inspections** → `ClientInspectionsStack`
  - `MyInspections`
  - `InspectionDetail`
- **Registry** → `RegistrySearch`
- **Bureau** → `BureauStack`
  - `BureauScreen`
  - `ChatScreen`

### 6.2 Адмін-навігація

Bottom Tabs (3 вкладки):

- **AdminHome** → `AdminDashboard`
- **Clients** → `AdminClientsStack`
  - `ClientsList`
  - `AdminClientDetail`
  - `AdminCaseDetail`
  - `CreateInvoice`
  - `ChatScreen`
- **AdminChats** → `AdminChatsStack`
  - `ClientsList`
  - `AdminChat`

---

## 7. Функціональні модулі — Клієнт

### 7.1 Головна (`ClientDashboard`)

- Персональне вітання з іменем клієнта.
- **Блок алертів** (AlertBanner):
  - Критичні перевірки (`danger`) — перехід до `InspectionDetail`.
  - Наступне засідання (`gold`) — перехід до `CaseDetail`.
  - Неоплачені рахунки (`warning`) — перехід до `MyInvoices`.
- **Статистика**: кількість справ, перевірок, відкритих рахунків (`StatCard`).
- **Сітка швидкого доступу** (6 кнопок): Справи, Перевірки, Реєстри, Бюро, Чат, Документи.
- **Активні справи**: список із датою наступного засідання, прогрес-баром, бейджем статусу.
- Pull-to-refresh для оновлення всіх даних.

### 7.2 Мої справи (`MyCases` + `CaseDetail`)

- Список усіх судових проваджень із бейджами статусів: Розглядається / Очікує рішення / Вирішено.
- Рядок пошуку: фільтрація за назвою, номером справи, судом.
- Прогрес-бар (0–100 %, встановлює адвокат).
- Pull-to-refresh.
- **Деталі справи**:
  - Заголовок, суд, номер, категорія, інстанція.
  - Прогрес-бар із відсотком.
  - Хронологія подій: дата, актор, текст.
  - Кнопки: «Написати адвокату» → `ChatScreen`, «Документи справи» → `MyDocuments`.

### 7.3 Документи (`MyDocuments` + `ScannerScreen`)

- Список файлів справи: назва, дата, розмір, тип.
- Кнопка відкриття файлу (`Linking.openURL` до підписаного Firebase URL).
- Кнопка «Сканувати документ» → `ScannerScreen`.
- **PDF-сканер (4 кроки)**:
  1. Вибір джерела: Камера (`react-native-image-picker`), Галерея, Файл (`DocumentPicker`).
  2. Перегляд: назва, розмір, тип. Підтвердження або повторний вибір.
  3. Завантаження: прогрес-бар у реальному часі (`uploadBytesResumable`).
  4. Успіх: підсумок (файл, справа, розмір, шифрування AES-256).

### 7.4 Рахунки (`MyInvoices`)

- **Зведення**: сума до сплати (`warning`) та вже оплачено (`success`).
- **Фільтри**: чіпи `Всі / Очікують / Оплачено / Прострочено`.
- Список рахунків: опис, сума, дата, бейдж статусу.
- Для оплати — кнопка «Оплатити» (MVP: відкриває `https://privat24.ua` або `paymentUrl` рахунку).

### 7.5 Перевірки (`MyInspections` + `InspectionDetail`)

- Список перевірок із бейджем статусу та рівнем ризику: `low / medium / high / critical`.
- Критичні перевірки виділяються червоним фоном + кнопка «Потрібен адвокат терміново».
- Pull-to-refresh.
- **Деталі перевірки**:
  - Орган, тип, предмет, термін.
  - Блок рекомендацій (підказки від адвоката для ДПС, АМКУ, Держпраці).
  - CTA: «Замовити супровід» або «Терміново зв'язатися».
  - Кнопка «Зателефонувати» → `tel:+380679040972`.

### 7.6 Пошук по реєстрах (`RegistrySearch`)

- Поле пошуку: ЄДРПОУ, ПІБ, назва компанії.
- Результат: назва, ЄДРПОУ, статус, адреса, директор, дата реєстрації.
- Блоки перевірок: податковий борг, АМКУ, судові справи, санкції.
- Сітка з 8 реєстрів: ЄДР, ЄДРСР, Реєстр адвокатів, Реєстр боржників, АМКУ, Санкції, Виконавчі провадження, Нотаріуси.
- **Примітка**: в MVP пошук симульований (mock). Фаза 2 — Opendatabot API.

### 7.7 Чат (`ChatScreen`)

- Real-time через Firestore `onSnapshot` — повідомлення з'являються миттєво.
- Бульбашки: клієнт праворуч (gold), адвокат ліворуч (card).
- Індикатор онлайн-статусу адвоката.
- Кнопка дзвінка в шапці.
- Автопрокрутка до останнього повідомлення.
- Відмітка прочитаних при відкритті чату.
- `KeyboardAvoidingView` для коректної роботи з клавіатурою.

### 7.8 Бюро (`BureauScreen`)

- **Про бюро**: статистика, спеціалізації, кваліфікація, адреса, години роботи.
- **Послуги**: 6 напрямків (Судовий супровід, Консультації, Реєстрація бізнесу, Договірна робота, Due Diligence, Захист бізнесу).
- **Звернення**: форма (ПІБ, email, телефон, опис) → збереження в `inquiries`.
- Кнопки: «Зателефонувати», «Email», «Сайт».
- Після відправлення — екран успіху з підтвердженням.

---

## 8. Функціональні модулі — Адмін (Адвокат)

### 8.1 Головна адміна (`AdminDashboard`)

- Статистика: кількість клієнтів, нових звернень, непрочитаних чатів (`StatCard`).
- Алерт про непрочитані повідомлення та нові звернення (`AlertBanner`).
- Список 5 останніх чатів: ім'я клієнта, останнє повідомлення, лічильник непрочитаних.
- Pull-to-refresh.

### 8.2 Список клієнтів (`ClientsList`)

- Повний список клієнтів із пошуком (ПІБ, телефон).
- Pull-to-refresh.
- Кнопка «+ Додати» → модальне вікно з формою (ПІБ, телефон, email).
- Збереження в `clients/{autoId}`.

### 8.3 Профіль клієнта (`AdminClientDetail`)

- Три вкладки:
  - **Справи**: список із прогрес-баром, датою засідання, кнопка «Нова справа».
  - **Рахунки**: список з бейджами, кнопка «Виставити рахунок» → `CreateInvoice`.
  - **Перевірки**: базова підтримка (повний CRUD — фаза 2).
- Модальне вікно нової справи: назва, номер, суд, категорія (Chip-selector).
- Кнопка чату → `AdminChat` з конкретним клієнтом.

### 8.4 Деталі справи адміна (`AdminCaseDetail`)

- Бейдж статусу, назва, суд, номер, категорія.
- Контроль прогресу: 7 preset-кнопок (0 %, 10 %, 25 %, 50 %, 75 %, 90 %, 100 %) — миттєве оновлення в Firebase.
- Дві вкладки:
  - **Хронологія**: кнопка «+ Додати подію» → Modal (текст + актор).
  - **Документи**: кнопка «+ Завантажити» → `DocumentPicker` → Firebase Storage з прогрес-баром.

### 8.5 Виставлення рахунку (`CreateInvoice`)

- Поля: опис послуги (multiline), сума (числове), дата оплати (опціонально).
- Попередній перегляд рахунку в реальному часі (live preview).
- Збереження → `clients/{id}/invoices/{autoId}`.
- Клієнт одразу бачить рахунок у своєму кабінеті.

### 8.6 Чати з клієнтами (`AdminChat`)

- Список усіх клієнтів із лічильниками непрочитаних повідомлень.
- Червоний badge з кількістю непрочитаних.
- Перехід → `ChatScreen` у режимі адміна (`from: "lawyer"`).
- Той самий `ChatScreen`, що й у клієнта — автоматично визначає роль через `useAuth().isLawyer`.

---

## 9. Утиліти та валідація (`helpers.js`)

| Функція | Призначення |
|---------|-------------|
| `formatDate(date, pattern)` | Форматування дати українською через `date-fns` / `uk` |
| `formatDateTime(date)` | `dd MMM yyyy, HH:mm` |
| `formatCurrency(amount)` | Гривні з роздільниками тисяч (`1 234 грн`) |
| `initials(fullName)` | Ініціали з ПІБ (`Євген Лукашенко` → `ЄЛ`) |
| `statusColors` | Мапа статус → HEX (success, warning, danger, gold) |
| `statusBgColors` | Мапа статус → `Bg`-колір (14 % opacity) |
| `validatePhoneUA(phone)` | Перевірка українського номера (+380, довжина 10–15 цифр) |
| `validateCode(code)` | SMS-код: 4–8 цифр |
| `validateRequired(value, label)` | Поле не порожнє |
| `validateNumber(value, label)` | Додатнє число |

---

## 10. Безпека та конфіденційність

| Аспект | Реалізація |
|--------|------------|
| Авторизація | Firebase Phone Auth (OTP) — без паролів, без self-registration |
| Доступ до даних | Firestore Security Rules — клієнт бачить лише свій `clientId` |
| Шифрування файлів | Firebase Storage AES-256, підписані URL з TTL |
| Ролі | Динамічна перевірка через колекцію `lawyers` (не JWT claims) |
| Мережа | HTTPS/TLS (Firebase default) |
| Локальні дані | Немає sensitive даних в AsyncStorage |
| Видалення | Заборонено для будь-якої ролі через Rules |
| PDF-сканер | Обробка на пристрої до завантаження (no third-party OCR) |

---

## 11. Push-сповіщення (FCM)

Firebase Cloud Messaging підключено. Тригери:

| Подія | Отримувач | Текст |
|-------|-----------|-------|
| Нова подія в справі | Клієнт | «Нова подія у справі №XXXX» |
| Новий рахунок | Клієнт | «Новий рахунок: X грн від адвоката» |
| Нове повідомлення в чаті | Клієнт / Адвокат | «Нове повідомлення від [ім'я]» |
| Нова перевірка | Клієнт | «Призначена перевірка ДПС: [дата]» |
| Нове звернення з форми | Адвокат | «Нове звернення від [ПІБ]» |

**Реалізація:**
- FCM-токен зберігається при авторизації → `clients/{id}.fcmToken`.
- Надсилання через Firebase Cloud Functions (тригери на `onCreate` в Firestore).
- Дозвіл на сповіщення запитується при першому запуску (`POST_NOTIFICATIONS` для Android 13+).

---

## 12. Епіки покращення LexTrack v2 (CMP-122)

| Епік | Задача | Виконавець | Пріоритет | Залежності |
|------|--------|------------|-----------|------------|
| [CMP-127](/CMP/issues/CMP-127) | Епік 1: Безпека та compliance | [@Технічний директор](agent://37a93a99-51cd-4e7d-ae76-780d5828bec8) | critical | — |
| [CMP-128](/CMP/issues/CMP-128) | Епік 2: Дані й продуктивність | [@Інженер-розробник](agent://e8dbbf36-43e1-451f-92bd-e8043b1c2c81) | critical | — |
| [CMP-129](/CMP/issues/CMP-129) | Епік 3: Перехід на TypeScript | [@Frontend-разробник](agent://6c83d36c-206f-4ae7-a48b-6f07cf6f1516) | high | CMP-127, CMP-128 |
| [CMP-130](/CMP/issues/CMP-130) | Епік 4: Реальні інтеграції | [@Інженер-розробник](agent://e8dbbf36-43e1-451f-92bd-e8043b1c2c81) | high | CMP-127, CMP-128 |
| [CMP-131](/CMP/issues/CMP-131) | Епік 5: Сканер документів та OCR | [@Frontend-разробник](agent://6c83d36c-206f-4ae7-a48b-6f07cf6f1516) | high | CMP-127, CMP-128 |
| [CMP-132](/CMP/issues/CMP-132) | Епік 6: UX, доступність та i18n | [@UI/UX Designer](agent://14ea443a-c252-46ea-82e8-2b81a15da0d5) | medium | CMP-129 |
| [CMP-133](/CMP/issues/CMP-133) | Епік 7: Підтримка iOS | [@DevOps-інженер](agent://e5180ff0-94c5-422e-8fed-113632fd974c) | medium | CMP-127, CMP-131 |
| [CMP-134](/CMP/issues/CMP-134) | Епік 8: Інженерна якість | [@QA-тестувальник](agent://d0477bb8-ba39-46a8-874e-9647e1cfb320) | medium | CMP-129, CMP-133 |
| [CMP-135](/CMP/issues/CMP-135) | Епік 9: Бізнес-функції | [@Інженер-розробник](agent://e8dbbf36-43e1-451f-92bd-e8043b1c2c81) | medium | CMP-130 |
| [CMP-126](/CMP/issues/CMP-126) | Документація технічного завдання | [@Технічний помічник](agent://061aa47b-e291-4066-b282-2c046fdefa74) | low | — |

### 12.1 Попередній план розробки (MVP — уже реалізовано)

| Фаза | Термін | Scope | Статус |
|------|--------|-------|--------|
| Фаза 1 | 4–6 тижнів | Firebase налаштування, авторизація, структура БД, правила безпеки, навігація, сервіси | ✅ Done |
| Фаза 2 | 3–4 тижні | Усі клієнтські екрани: Dashboard, Cases, Documents, Invoices, Inspections, Chat, Registry, Bureau | ✅ Done |
| Фаза 3 | 2–3 тижні | Адмін-панель: Dashboard, ClientsList, ClientDetail, CaseDetail, CreateInvoice, AdminChat | ✅ Done |
| Фаза 4 | 1–2 тижні | PDF-сканер, завантаження файлів, Firebase Storage інтеграція | ✅ Done |
| Фаза 5 | 1–2 тижні | Push-сповіщення (FCM), Cloud Functions тригери | ✅ Done |
| Фаза 6 | 1–2 тижні | Тестування, QA, публікація Google Play | ✅ Done |
| Фаза 7 | Наступний цикл | iOS (App Store), LiqPay оплата, Opendatabot API, white-label | 🔄 Епіки CMP-127–CMP-135 |

### 12.1 Бюджет MVP

| Стаття витрат | Сума | Примітка |
|---------------|------|----------|
| Розробник (React Native, 2–3 міс) | 60 000–90 000 грн | Фіксований контракт |
| Firebase (Blaze план) | ~500–2 000 грн/міс | Залежно від трафіку |
| Google Play Developer | 1 100 грн | Одноразово ($25) |
| Apple Developer (фаза 2) | 4 300 грн/рік | $99/рік |
| Дизайн / іконки / скріншоти | 5 000 грн | Store assets |
| Google Ads (перший місяць) | 7 000 грн | Залучення перших 500 користувачів |
| Резерв | 10 000 грн | Непередбачені витрати |

---

## 13. Нефункціональні вимоги

### 13.1 Продуктивність

- Час холодного старту: < 3 секунд.
- Завантаження даних при відкритті екрану: < 2 секунд.
- Повідомлення в чаті: відображення < 500 мс (`onSnapshot`).
- Завантаження файлу 1 МБ: < 5 секунд на 4G.

### 13.2 Надійність

- Firebase SLA: 99.95 % uptime.
- Offline-режим: базова навігація доступна, дані з Firestore cache.
- Обробка помилок: `Alert.alert` для всіх failed операцій.

### 13.3 Підтримка

- Android 6.0 (API 23) — Android 14 (API 34).
- Мінімальна роздільна здатність: 360×640 пікселів.
- Dark-режим: додаток завжди в темній темі (by design, Palette V2).

### 13.4 Масштабування

- Firestore: автоматичне масштабування до мільйонів документів.
- White-label: бренд змінюється через `theme.js` + константи.
- Мультимовність: структура готова, i18n підключається в фазі 3.

---

## 14. Зовнішні інтеграції

| Сервіс | Статус | Фаза | Опис |
|--------|--------|------|------|
| Firebase Auth | MVP | Фаза 1 | SMS OTP авторизація |
| Firestore | MVP | Фаза 1 | Основна база даних |
| Firebase Storage | MVP | Фаза 4 | PDF та документи |
| FCM | MVP | Фаза 5 | Push-сповіщення |
| Opendatabot API | Фаза 2 | Фаза 7 | Реальний пошук по реєстрах |
| LiqPay | Фаза 2 | Фаза 7 | Онлайн-оплата рахунків |
| Google Play | MVP | Фаза 6 | Публікація Android |
| App Store | Фаза 2 | Фаза 7 | Публікація iOS |

---

## 15. Початковий код та швидкий старт

### 15.1 Клонування

```bash
git clone https://github.com/LukashEvgen/abapp.git
cd abapp && npm install
```

### 15.2 Firebase налаштування

1. Завантажити `google-services.json` з Firebase Console → `android/app/`.
2. Скопіювати `firestore.rules` → Firebase Console → Firestore → Rules → Publish.
3. Додати себе як адміна: Firebase Auth → Add user, потім Firestore → `lawyers/{uid}`.

### 15.3 Запуск

```bash
npm start        # Metro bundler
npm run android  # Android (потрібен емулятор або пристрій)
```

### 15.4 Що вже реалізовано

- 44 файли — повна структура проекту.
- 7 Firebase сервісів (auth, clients, cases, documents, invoices, messages, inspections).
- 11 клієнтських екранів + 6 адмін-екранів.
- Повна навігація (Stack + BottomTabs) для обох ролей.
- Дизайн-система v2: 12 shared компонентів на базі `design/tokens.json`.
- Правила безпеки Firestore (`firestore.rules`).
- Android конфігурація: `build.gradle`, `AndroidManifest.xml`.
- `README.md` та інтерактивні прев'ю: `palette-v2-preview.html`, `mockups-preview.html`.

---

## 16. Контакти замовника

**Адвокат Євген Лукашенко**  
✆ 067 904 09 72  
✉ ev.lukashenko@gmail.com  
🌐 ab.vn.ua  
📍 Sofiyivska Borshchahivka, Kyivska obl.
