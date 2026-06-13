# LexTrack — Аналіз репозиторію та план наступних етапів розробки
## Звіт Mobile PM (MYA-6) | Дата: 2026-06-13

---

## 1. Загальна оцінка проєкту

LexTrack — мобільний додаток для юридичного трекінгу на базі **React Native 0.73.6 + Firebase**.

| Показник | Оцінка |
|----------|--------|
| Статус | MVP завершено (фази 1–6 ✅), перехід до v2 (епіки CMP-127–CMP-135) |
| Платформа | Android (prod) + iOS (підготовка, фаза 7) |
| Кодова база | ~4580 рядків екранів (JS), 23 TS/TSX файли (початок міграції), Cloud Functions (TS) |
| Firebase | Auth, Firestore, Storage, Cloud Messaging, App Check, Cloud Functions |
| Статус публікації | Google Play (MVP) — опубліковано |

---

## 2. Структура кодової бази (src/)

### 2.1 Екрани
- **Client screens (16 файлів, ~2860 рядків):** Dashboard, Cases, Documents, Scanner, Invoices, Inspections, Registry, Bureau, Chat, CourtSearch, EdrSearch, EnforcementSearch, RegistryDetail, RegistriesScreen
- **Admin screens (6 файлів, ~1050 рядків):** Dashboard, ClientsList, ClientDetail, CaseDetail, CreateInvoice, AdminChat
- **Shared screens (5 файлів, ~670 рядків):** LoginScreen, ChatScreen, DocumentDetail, DiiaSignScreen, SignResultScreen

### 2.2 Архітектура
- `context/AuthContext.js` — глобальний стан авторизації (Phone OTP)
- `navigation/AppNavigator.js` — Stack + Bottom Tabs
- `services/firebase.js` + `lib/queryClient.ts` — Firebase CRUD, TanStack Query
- `components/shared/UIComponents.js` — 12 дизайн-компонентів (Badge, GoldButton, Card, Input, AlertBanner, StatCard, Avatar, ProgressBar, LoadingScreen, EmptyState, SectionLabel)
- `utils/theme.js` + `utils/helpers.js` — Design tokens (Palette V2), форматування, валідація
- `styles/chatStyles.js` — стилі чату

### 2.3 Cloud Functions (functions/src/)
- `index.ts` — точка входу
- `messages.ts`, `caseEvents.ts`, `invoices.ts`, `inspections.ts`, `documents.ts` — CRUD + тригери
- `push.ts` — FCM push-нотифікації (5 сценаріїв: чат, подія справи, рахунок, перевірка, звернення)
- `auditLog.ts` — аудит дій
- `virusScan.ts` — перевірка файлів
- `signatures.ts`, `kepAuth.ts` — КЕП / Дія.Підпис
- `registry/*.ts` — інтеграції з реєстрами (court, edr, enforcement)
- `storageTriggers.ts` — тригери Firebase Storage

### 2.4 Безпека
- `firestore.rules` — ролева модель (клієнт = тільки свої дані, адвокат = усі дані)
- `SecurityGate.js`, `SensitiveScreenGuard.js` — додаткові захисні шари
- Firebase App Check (Play Integrity Android, DeviceCheck iOS)
- Аудит-лог, заборона видалення через Rules

---

## 3. Порівняння з ТЗ v2 — що вже реалізовано

| Модуль | Статус | Примітки |
|--------|--------|----------|
| Авторизація (Phone OTP) | ✅ Реалізовано | Firebase Auth, самореєстрація неможлива |
| Клієнтські екрани (11) | ✅ Реалізовано | + додаткові реєстрові екрани (CourtSearch, EdrSearch, EnforcementSearch) |
| Адмін-екрани (6) | ✅ Реалізовано | Dashboard, Clients, Cases, Invoices, Chat |
| PDF-сканер | ✅ Реалізовано | Камера, галерея, DocumentPicker, Firebase Storage |
| Push-сповіщення (FCM) | ✅ Реалізовано | 5 тригерів через Cloud Functions |
| Firestore Security Rules | ✅ Реалізовано | Покриті unit-тестами |
| TanStack Query | ✅ Реалізовано | queryClient.ts, кешування, оптимістичні оновлення |
| Design System V2 (Palette V2) | ✅ Реалізовано | tokens.json, theme.js, глобальні стилі |
| КЕП / Дія.Підпис | ✅ Частково | DiiaSignScreen.tsx, SignResultScreen.js |
| Чат real-time | ✅ Реалізовано | onSnapshot, бульбашки, онлайн-статус |
| Firebase App Check | ✅ Реалізовано | Android Play Integrity, iOS DeviceCheck |

---

## 4. Технічний борг та ризики

| Ризик | Рівень | Опис |
|-------|--------|------|
| Типізація (JS → TS) | Середній | 57 JS vs 23 TS/TSX — міграція незавершена. Новий код має бути на TS. |
| iOS підтримка | Високий | ios/ скелет присутній, але без повного тестування та App Store деплою |
| LiqPay інтеграція | Високий | Оплата рахунків — заглушка (відкриває Privat24). Потрібна реальна інтеграція. |
| Opendatabot API | Середній | Пошук по реєстрах — mock-дані. Потрібна реальна API-інтеграція. |
| OCR / автообрізання | Середній | Сканер завантажує файли, але OCR розпізнавання не реалізовано. |
| E2E тестування | Середній | Відсутні E2E тести (Detox не підключено). |
| Sentry / Crashlytics | Низький | Немає зовнішнього моніторингу помилок. |
| White-label | Низький | Потрібна підтримка шаблонів для інших бюро. |

---

## 5. План наступних епіків (CMP-127 – CMP-135)

### Епік 1: Безпека та compliance (CMP-127) — CRITICAL
**Виконавець:** Технічний директор (CTO)
**Задачі:**
- Аудит Firestore Security Rules (покриття всіх edge-cases)
- GDPR / ЗУ 152 — механізм експорту / видалення персональних даних
- Перевірка Firebase App Check на production
- Завершення аудит-логу для всіх операцій

### Епік 2: Дані й продуктивність (CMP-128) — CRITICAL
**Виконавець:** Інженер-розробник (Backend Developer)
**Задачі:**
- Оптимізація запитів Firestore (індекси, складні queries)
- Пагінація списків (клієнти, справи, документи)
- Офлайн-кеш TanStack Query — доопрацювання
- Оптимістичні оновлення — покриття всіх CRUD-операцій

### Епік 3: Перехід на TypeScript (CMP-129) — HIGH
**Виконавець:** Frontend-розробник
**Задачі:**
- Міграція залишкових JS-екранів на TSX (пріоритет: admin/, shared/)
- Типізація моделей Firestore (clients, cases, invoices, inspections)
- Strict mode у tsconfig.json
- Рефакторинг `services/firebase.js` → `services/*.ts`

### Епік 4: Реальні інтеграції (CMP-130) — HIGH
**Виконавець:** Інженер-розробник (Backend Developer)
**Задачі:**
- Opendatabot API: ЄДР, ЄДРСР, виконавчі провадження, АМКУ
- LiqPay API: створення рахунків, оплата, callback
- Google Maps: адреса бюро, навігація
- Інтеграція з судовими реєстрами (court.ts вже є в functions/)

### Епік 5: Сканер документів та OCR (CMP-131) — HIGH
**Виконавець:** Frontend-розробник
**Задачі:**
- OCR-розпізнавання тексту з PDF/зображень (Tesseract або ML Kit)
- Автообрізання сканів (перспектива, границі)
- Метадані PDF (теги, дата, автор)
- Покращення UI ScannerScreen (crop, rotate, filters)

### Епік 6: UX, доступність та i18n (CMP-132) — MEDIUM
**Виконавець:** UI/UX Designer
**Задачі:**
- Локалізація uk/en (L10n)
- VoiceOver (iOS) / TalkBack (Android) — accessibility labels
- Анімації Reanimated 3 для переходів між екранами
- Dark mode підтримка (якщо не повна Palette V2)

### Епік 7: Підтримка iOS (CMP-133) — MEDIUM
**Виконавець:** DevOps Engineer + iOS Developer
**Задачі:**
- Повна Xcode-конфігурація (підписи, provisioning profiles)
- Firebase iOS налаштування (GoogleService-Info.plist, App Check DeviceCheck)
- Push-сповіщення на iOS (APNs через FCM)
- Підготовка до App Store Review (guidelines compliance)
- CI/CD pipeline для iOS build (GitHub Actions / Codemagic)

### Епік 8: Інженерна якість (CMP-134) — MEDIUM
**Виконавець:** QA Engineer
**Задачі:**
- E2E тести Detox (критичні user flows: логін → справи → чат → рахунок)
- Performance monitoring (Firebase Performance Monitoring або Sentry)
- Sentry crash reporting інтеграція
- Навантажувальне тестування Cloud Functions
- Regression test suite automation

### Епік 9: Бізнес-функції (CMP-135) — MEDIUM
**Виконавець:** Інженер-розробник (Backend Developer)
**Задачі:**
- Аналітика Amplitude / Firebase Analytics (user flows, retention)
- White-label шаблон (конфігурація кольорів, логотипу, назви бюро)
- Додаткові push-сценарії (нагадування про засідання, прострочені рахунки)
- Публічна сторінка бюро (WebView або окремий лендінг)

---

## 6. Розподіл задач між командами

| Команда / Роль | Основні епіки | Пріоритет |
|----------------|---------------|-----------|
| **CTO** | CMP-127 (Безпека), архітектурний review всіх епіків | Critical |
| **Backend Developer** | CMP-128 (Продуктивність), CMP-130 (Інтеграції), CMP-135 (Бізнес) | Critical + High |
| **Frontend-розробник** | CMP-129 (TypeScript), CMP-131 (OCR/Scanner) | High |
| **iOS Developer** | CMP-133 (iOS), підтримка native iOS features | Medium |
| **Android Developer** | Android-специфічні покращення, native modules для OCR/scanner | Medium |
| **UI/UX Designer** | CMP-132 (UX/i18n), мокапи нових екранів, Design System оновлення | Medium |
| **QA Engineer** | CMP-134 (Якість), E2E, regression, load testing | Medium |
| **DevOps Engineer** | CMP-133 (iOS CI/CD), Firebase CI/CD, env management | Medium |
| **Mobile PM** (я) | Координація, sprint planning, звіти CEO, monitoring | — |

---

## 7. Рекомендації CEO

1. **Паралельний запуск:** CMP-127 (безпека) і CMP-128 (продуктивність) можуть іти паралельно — незалежні зони.
2. **TS-перехід першим:** CMP-129 блокує CMP-132 (i18n потребує типізованих рядків) та CMP-134 (E2E краще писати на TS). Рекомендую запустити одразу після CMP-127/128.
3. **iOS = приоритет після summer:** CMP-133 потребує Apple Developer Account ($99/рік) та macOS для білду. DevOps має підготувати CI/CD заздалегідь.
4. **LiqPay = високий ROI:** Інтеграція оплати підвищить конверсію рахунків. Можна запустити як hotfix в рамках CMP-130.
5. **Не деплоювати без схвалення CTO:** Як зазначено в README — production деплой Firebase / Google Play потребує review CTO.

---

*Звіт підготовлено Mobile PM (9022dcbd) | Виконано в рамках MYA-6*
