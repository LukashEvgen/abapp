# LexTrack Repository Analysis Report
## Від Mobile PM | MYA-6 | 2026-06-13

---

## 1. Загальний огляд проєкту

| Параметр | Значення |
|----------|----------|
| Проєкт | LexTrack v2 |
| Платформа | React Native 0.73.6 (Android + iOS) |
| Бекенд | Firebase (Auth, Firestore, Storage, FCM, Cloud Functions) |
| Поточна версія | 1.0.1 (build 2, Android) |
| Статус MVP | Фази 1-6 — DONE |
| Статус Phase 7 | Епіки CMP-127..CMP-135 — В ПРОЦЕСІ |
| Всього файлів | 82 у src/, 20 Cloud Functions, 14 android/, 14 ios/ |
| LOC | ~4900 (фронтенд JS/TS), ~8600 (functions TS) |

---

## 2. Структура кодової бази

### Frontend (src/)

| Категорія | К-сть файлів | Формат | Статус |
|-----------|------------|--------|--------|
| Screens (client) | 17 | .js | Legacy |
| Screens (admin) | 6 | .js | Legacy |
| Screens (shared) | 5 | .js + .tsx | Частково |
| Services | 17 | .ts (14) + .js (3) | Частково TS |
| Components | 5 | .js | Legacy |
| Context | 2 | .js + .tsx | Дублювання |
| Hooks | 3 | .js + .ts | Частково |
| Utils/Security | 6 | .js | Legacy |

**Загальний баланс:** 57 JS / 21 TS / 2 TSX — міграція на TypeScript лише на 25%.

### Cloud Functions (functions/src/)

| Модуль | Призначення | Статус |
|--------|-------------|--------|
| index.ts | Експорт 15+ callable / onCall / onRequest | ✅ |
| messages.ts | Chat + unreadCount summary | ✅ |
| caseEvents.ts | Тригери подій у справах | ✅ |
| inspections.ts | Перевірки + публічні звернення | ✅ |
| inquiries.ts | Публічна форма звернень | ✅ |
| push.ts | FCM push notifications | ✅ |
| documents.ts | OCR + scanDocument | 🔄 (Epic CMP-131) |
| signatures.ts | Дія.Підпис / КЕП | ✅ |
| kepAuth.ts | id.gov.ua OAuth | ✅ |
| storageTriggers.ts | Вірус-скан + аудит | ✅ |
| virusScan.ts | Повторна перевірка файлів | ✅ |
| auditLog.ts | Логування операцій | ✅ |
| registry/* | ЄДР, ЄДРСР, виконавчі провадження | 🔄 (mock) |
| payments.ts | LiqPay | 🔄 (Epic CMP-130) |

---

## 3. Реалізований функціонал (MVP — DONE)

- ✅ Firebase Phone OTP авторизація
- ✅ Firestore CRUD (clients, cases, documents, invoices, inspections, messages)
- ✅ Firebase Storage (PDF, документи, AES-256)
- ✅ Push notifications (FCM) з 5 тригерами
- ✅ 11 клієнтських + 6 адмін-екранів
- ✅ Навігація Stack + BottomTabs для обох ролей
- ✅ Design System V2 (Palette V2, tokens.json)
- ✅ Firestore Security Rules (isScanned gate, size limits, role-based)
- ✅ App Check (Play Integrity, DeviceCheck, debug tokens)
- ✅ Дія.Підпис інтеграція (KEP OAuth + signDocument)
- ✅ Biometric + session TTL (30 хв)
- ✅ Jailbreak detection
- ✅ Google Play публікація (v1.0.1)

---

## 4. Критичні прогалини та блокери

### 🔴 Критично (блокує наступні етапи)

| # | Проблема | Наслідок | Відповідальний |
|---|----------|----------|----------------|
| 1 | **iOS — не сконфігурований** | Блокує App Store, Epic CMP-133 | iOS Developer (MYA-7) |
| 2 | **TypeScript міграція на 25%** | Блокує Epic CMP-129 (strict mode, типи) | Frontend-разробник |
| 3 | **Немає CI/CD pipeline** | Ручний деплой, ризик людської помилки | DevOps (MYA-12) |
| 4 | **Немає E2E тестів** | Неможливо верифікувати релізи перед публікацією | QA (MYA-10) |
| 5 | **API-інтеграції — mock** | Opendatabot, LiqPay — фіктивні дані | Backend (MYA-9) |

### 🟡 Високо (погіршує якість)

| # | Проблема | Наслідок |
|---|----------|----------|
| 6 | AuthContext дублюється (.js + .tsx) | Ризик розсинхронізації стану |
| 7 | Screens — лише .js (без типів) | Помилки runtime, складно рефакторити |
| 8 | Немає Sentry / crash reporting | Неможливо аналізувати збої користувачів |
| 9 | Немає Amplitude / аналітики | Неможливо вимірювати retention/conversion |
| 10 | Тести: лише rules + функції (15 файлів) | Нуль coverage для UI/screens |

---

## 5. План наступних етапів розробки (Phase 7)

### Епіки CMP-127..CMP-135 — розподіл за командами

#### 🔒 Epic 1: Безпека та compliance (CMP-127) — КРИТИЧНО
- Перевірка App Check на prod (видалення debug tokens)
- GDPR / 152 ЗУ — аудит збору даних
- Аудит Firestore Rules (penetration testing)
- Biometric fallback для Android < 9

#### ⚡ Epic 2: Дані й продуктивність (CMP-128) — КРИТИЧНО
- TanStack Query — оптимістичні оновлення, кеш
- Пагінація всіх списків (limit 20 + cursor)
- Offline-режим (Firestore persistence + retry queue)
- Image lazy-loading + memoization

#### 📝 Epic 3: Перехід на TypeScript (CMP-129) — ВИСОКО
- Міграція screens/ з .js → .tsx
- Міграція components/ з .js → .tsx
- Strict mode: `noImplicitAny`, `strictNullChecks`
- Типи для всіх моделей Firestore

#### 🔌 Epic 4: Реальні інтеграції (CMP-130) — ВИСОКО
- Opendatabot API для реєстрів (ЄДР, ЄДРСР, АМКУ)
- LiqPay оплата рахунків
- Google Maps (адреса бюро, маршрут)
- Реальний Court API (ЄДРСР)

#### 📄 Epic 5: Сканер та OCR (CMP-131) — ВИСОКО
- OCR-розпізнавання тексту з PDF
- Автообрізання (document edge detection)
- Метадані PDF (title, author, creation date)
- Batch upload (кілька файлів одночасно)

#### 🎨 Epic 6: UX, доступність та i18n (CMP-132) — СЕРЕДНЄ
- Локалізація uk/en
- VoiceOver (iOS) + TalkBack (Android)
- Анімації Reanimated 3
- Dark/light mode toggle (зараз лише dark)

#### 🍎 Epic 7: Підтримка iOS (CMP-133) — СЕРЕДНЄ
- Xcode конфігурація, Firebase iOS setup
- Push notifications на iOS
- App Store Connect, screenshots, metadata
- TestFlight beta

#### 🧪 Epic 8: Інженерна якість (CMP-134) — СЕРЕДНЄ
- E2E тести Detox
- Unit tests Jest (coverage > 80%)
- Sentry crash reporting
- Perf monitoring (Firebase Performance)

#### 💼 Epic 9: Бізнес-функції (CMP-135) — СЕРЕДНЄ
- Amplitude аналітика (events funnel)
- White-label шаблон (інші бюро)
- Push сценарії (нагадування, retention)
- Адмін-панель для керування клієнтами (web)

---

## 6. Рекомендований порядок виконання (залежності)

```
Паралельно:          CMP-127 (Security)  CMP-128 (Performance)
                              ↓                    ↓
              ┌───────────────┴────────────────────┘
              ↓
         CMP-129 (TypeScript)
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
CMP-130 (Integrations)  CMP-131 (Scanner/OCR)
    ↓                   ↓
    └─────────┬─────────┘
              ↓
         CMP-133 (iOS)
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
CMP-132 (UX/i18n)    CMP-134 (QA/Tests)
    ↓                   ↓
    └─────────┬─────────┘
              ↓
         CMP-135 (Business)
```

---

## 7. Висновки для CEO

1. **LexTrack MVP повністю реалізований** і опублікований на Google Play (v1.0.1).
2. **Phase 7 — 9 епіків**, кожен з чітким scope. Загальна оцінка: 3-4 місяці роботи з повною командою.
3. **Критичні блокери:** iOS (немає конфігурації), TypeScript (25% готовності), CI/CD (немає), E2E тести (немає).
4. **Першочергові задачі:**
   - iOS Developer (MYA-7): аудит Xcode-проєкту
   - Android Developer (MYA-8): аудит Android-частини
   - Backend Developer (MYA-9): аудит Firebase-функцій
   - QA (MYA-10): план тестування
   - Design (MYA-11): рев'ю дизайн-системи
   - DevOps (MYA-12): CI/CD pipeline
5. **Рекомендація:** запустити CMP-127 + CMP-128 паралельно з MYA-7..MYA-12, потім CMP-129 як блокуючий етап для всіх наступних.

---

*Звіт підготовлено Mobile PM (Agent ID: 9022dcbd-f4c3-45dc-a53b-9a27868f3247)*
*Проєкт: LexTrack (Mobile Apps, Company: 456f56ad-7d71-432f-b9dd-ec1ebe7ac37c)*
