# Аналіз кросплатформеного потенціалу: Flutter vs React Native для LexTrack

**Завдання:** MYA-13  
**Автор:** Flutter Developer Agent  
**Дата:** 2026-06-13  
**Статус:** Готово до рев'ю

---

## 1. Поточний стан проєкту LexTrack

### 1.1 Технологічний стек (React Native)

| Компонент | Версія / Пакет | Призначення |
|-----------|---------------|-------------|
| React Native | 0.73.6 | Основний фреймворк |
| React | 18.2.0 | UI рендеринг |
| TypeScript | 5.0.4 | Типізація (часткова — `.js` + `.ts` мікс) |
| Metro | 0.73.x | Bundler |

### 1.2 Архітектура додатка

- **~4900 рядків** коду в `src/` (JS/TS/TSX)
- **2 ролі користувачів:** клієнт (клієнтська вкладка) та адвокат (адмін-панель)
- **Навігація:** React Navigation (Native Stack + Bottom Tabs), динамічний рендеринг на основі ролі
- **Стан:** React Context (Auth) + TanStack Query (React Query v5) для серверного стану
- **Безпека:** Multi-layer — AppCheck, jailbreak detection, biometric, session timeout, sensitive screen guard
- **Push-сповіщення:** Firebase Cloud Messaging через `@react-native-firebase/messaging`
- **Документи:** PDF-перегляд, сканування, КЕП-підпис через Дія/id.gov.ua (OAuth deep linking)

### 1.3 Ключові нативні залежності (React Native)

| Пакет | Flutter-еквівалент | Статус у Flutter |
|-------|-------------------|------------------|
| `@react-native-firebase/app` | `firebase_core` | Офіційний, стабільний |
| `@react-native-firebase/auth` | `firebase_auth` | Офіційний, повна підтримка phone auth |
| `@react-native-firebase/firestore` | `cloud_firestore` | Офіційний, realtime listeners |
| `@react-native-firebase/messaging` | `firebase_messaging` | Офіційний, push-сповіщення |
| `@react-native-firebase/storage` | `firebase_storage` | Офіційний |
| `@react-native-firebase/functions` | `cloud_functions` | Офіційний |
| `@react-native-firebase/app-check` | `firebase_app_check` | Офіційний |
| `react-native-reanimated` | `flutter_animate` / вбудоване | Flutter має власний Animation API |
| `react-native-gesture-handler` | Вбудоване у Flutter | GestureDetector, Draggable |
| `react-native-linear-gradient` | `flutter_gradient` / `BoxDecoration` | Вбудована підтримка |
| `react-native-pdf` | `flutter_pdfview` / `pdfx` | Стабільні пакети |
| `react-native-webview` | `webview_flutter` | Офіційний пакет від Google |
| `react-native-image-picker` | `image_picker` (official) | Офіційний |
| `react-native-document-picker` | `file_picker` | Стабільний |
| `react-native-blob-util` | `dio` / `http` + `path_provider` | Flutter має кращу роботу з файлами |
| `react-native-vector-icons` | `flutter_icons` / `font_awesome_flutter` | Широкий вибір |
| `@react-navigation/native` | `go_router` / Navigator 2.0 | GoRouter — рекомендований |
| `@tanstack/react-query` | Немає прямого аналога | Riverpod + `FutureProvider` / `AsyncNotifier` |

---

## 2. Оцінка Firebase-інтеграції з Flutter

### 2.1 Офіційна підтримка

Flutter має **офіційні плагіни від Google** для Firebase (підтримуються тією ж командою, що й native SDK):

```yaml
dependencies:
  firebase_core: ^2.0.0
  firebase_auth: ^4.0.0
  cloud_firestore: ^4.0.0
  firebase_messaging: ^14.0.0
  firebase_storage: ^11.0.0
  cloud_functions: ^4.0.0
  firebase_app_check: ^0.2.0
```

### 2.2 Функціональний паритет

| Функція | React Native | Flutter | Коментар |
|---------|-------------|---------|----------|
| Phone Auth | ✅ `@react-native-firebase/auth` | ✅ `firebase_auth` | Повна підтримка reCAPTCHA + SMS |
| Firestore realtime | ✅ `.onSnapshot()` | ✅ `.snapshots()` | Dart Streams замість callbacks |
| Push Notifications | ✅ FCM + `@react-native-firebase/messaging` | ✅ FCM + `firebase_messaging` | Повний паритет |
| App Check | ✅ `@react-native-firebase/app-check` | ✅ `firebase_app_check` | SafetyNet / DeviceCheck / reCAPTCHA v3 |
| Cloud Functions | ✅ `.httpsCallable()` | ✅ `.httpsCallable()` | Ідентичний API |
| Storage upload/download | ✅ `.putFile()` / `.getDownloadURL()` | ✅ `.putFile()` / `.getDownloadURL()` | Повний паритет |

**Висновок:** Firebase-інтеграція у Flutter має **повний функціональний паритет** з React Native. Міграція Firebase-шару — **низький ризик**.

---

## 3. Порівняльний аналіз: Flutter vs React Native

### 3.1 Performance та рендеринг

| Критерій | React Native | Flutter | Переможець |
|----------|-------------|---------|-----------|
| Рендеринг | JS bridge → Native UI thread | Skia directly (impeller на iOS) | **Flutter** — менше latency, 60/120 FPS без додаткової роботи |
| Startup time | Metro bundler, Hermes engine | AOT компіляція, менший overhead | **Flutter** — швидший cold start |
| Bundle size | ~20-30 MB (Hermes + native libs) | ~15-25 MB (в залежності від архітектури) | **Flutter** — трохи менший |
| Анімації | Reanimated (C++), але потребує налаштувань | Вбудовані — 60/120 FPS з коробки | **Flutter** — значно кращі без зусиль |
| Scroll performance | Потребує оптимізації для списків | Вбудовані оптимізовані ListView | **Flutter** — кращий UX |

### 3.2 Платформна підтримка

| Платформа | React Native | Flutter |
|-----------|-------------|---------|
| iOS | ✅ Повна | ✅ Повна |
| Android | ✅ Повна | ✅ Повна |
| Web | ⚠️ Експериментальний | ✅ Стабільний ( canvaskit / html renderer ) |
| Desktop (Windows/macOS/Linux) | ⚠️ Експериментальний | ✅ Стабільний |
| **Висновок** | | **Flutter має суттєву перевагу для веб та десктопу** |

### 3.3 Екосистема та пакети

| Критерій | React Native | Flutter |
|----------|-------------|---------|
| Пакетів на pub.dev / npm | 1M+ npm | 40K+ pub.dev, але якісніші |
| Офіційні пакети Google | ✅ | ✅ (часто кращі — `google_maps_flutter`, `camera` тощо) |
| Пакети з нативним кодом | Часто потребують manual linking | `flutter pub add` + автоматичний конфіг — зазвичай працює з коробки |
| Fragmentation пакетів | Висока (багато deprecated) | Нижча, активна підтримка Google |

### 3.4 Мова програмування

| Критерій | React Native (JS/TS) | Flutter (Dart) |
|----------|---------------------|----------------|
| Типізація | TS — optional, часто relaxed | Dart — sound null safety з коробки, строга |
| Крива навчання | Низька (JS популярний) | Середня (Dart схожий на TS/C#) |
| Hot reload | ✅ Fast Refresh | ✅ Hot reload + hot restart (швидший) |
| Compile-time safety | TS — транспіляція | Dart — AOT компіляція, runtime errors мінімізовані |

---

## 4. Специфічні виклики LexTrack та їх оцінка

### 4.1 Дія КЕП / OAuth Deep Linking

**React Native:** `Linking` API + `lextrack://kep` custom scheme. Реалізовано у `DiiaSignScreen.tsx`.

**Flutter:** `uni_links` / `app_links` пакети + `url_launcher`. Повний функціональний аналог. Deep linking у Flutter — **стабільний та простіший** у налаштуванні (AndroidManifest + Info.plist генерується автоматично).

**Оцінка:** 🟢 **Низький ризик міграції**

### 4.2 Біометрична автентифікація

**React Native:** `react-native-biometrics` або Expo LocalAuthentication.

**Flutter:** `local_auth` (офіційний пакет від Google). Підтримує Face ID, Touch ID, fingerprint на Android.

**Оцінка:** 🟢 **Низький ризик**

### 4.3 Jailbreak / Root Detection

**React Native:** Кастомний модуль `src/security/jailbreak.js`.

**Flutter:** `flutter_jailbreak_detection` або `safe_device`. Потребує мінімальних змін.

**Оцінка:** 🟡 **Середній ризик** — кастомна логіка потребує перенесення

### 4.4 PDF перегляд та документи

**React Native:** `react-native-pdf` + `react-native-blob-util`.

**Flutter:** `flutter_pdfview` (Android) / `pdfx` (кросплатформний). Для генерації PDF — `pdf` пакет.

**Оцінка:** 🟢 **Низький ризик** — Flutter має більш зрілу екосистему PDF

### 4.5 Сканер документів

**React Native:** `react-native-image-picker` + кастомна обробка.

**Flutter:** `google_mlkit_document_scanner` (офіційний ML Kit) або `cunning_document_scanner`.

**Оцінка:** 🟡 **Середній ризик** — ML Kit інтеграція може вимагати додаткових налаштувань

### 4.6 Push Notifications

**React Native:** `@react-native-firebase/messaging` + кастомні канали.

**Flutter:** `firebase_messaging` + `flutter_local_notifications`. Повний паритет, але канали сповіщень налаштовуються інакше.

**Оцінка:** 🟡 **Середній ризик** — логіка каналів та обробки фонових повідомлень потребує переписування

### 4.7 Sensitive Screen Guard

**React Native:** Кастомний модуль `SensitiveScreenGuard` (native code для iOS/Android).

**Flutter:** `secure_screen` або `flutter_windowmanager` (Android) + `UIApplication.shared.isIdleTimerDisabled` через method channel (iOS).

**Оцінка:** 🔴 **Високий ризик** — потребує написання platform-specific коду

### 4.8 AppCheck

**React Native:** `@react-native-firebase/app-check` — автоматичний.

**Flutter:** `firebase_app_check` — повний аналог.

**Оцінка:** 🟢 **Низький ризик**

---

## 5. Трудомісткість міграції

### 5.1 Оцінка за компонентами

| Компонент | Рядків (прибл.) | Час міграції (Flutter Developer, FTE) | Ризик |
|-----------|----------------|----------------------------------------|-------|
| Firebase-шар (services/) | ~800 | 1-1.5 тижні | 🟢 Низький |
| Auth + Security Context | ~300 | 1 тиждень | 🟡 Середній |
| Navigation (AppNavigator) | ~200 | 3-4 дні (GoRouter) | 🟢 Низький |
| UI Components + Screens | ~2500 | 3-4 тижні | 🟡 Середній |
| Push Notifications | ~100 | 2-3 дні | 🟡 Середній |
| DiiaSign (Deep Linking) | ~320 | 3-4 дні | 🟢 Низький |
| Security (jailbreak, biometric, screen guard) | ~200 | 1-1.5 тижні | 🔴 Високий |
| Tests (unit + integration) | ~800 | 1-1.5 тижні | 🟡 Середній |
| **ЗАГАЛОМ** | **~4900** | **8-12 тижнів (1 FTE)** | |

### 5.2 Паралельна підтримка двох платформ

Якщо рішення — **підтримувати обидві версії**:

- **Плюс:** Знижує ризик для користувачів, A/B тестування
- **Мінус:** Подвоює вартість підтримки (bug fixes, оновлення Firebase, нові фічі)
- **Рекомендація:** ❌ Не рекомендується для команди < 3 розробників

---

## 6. Рекомендації для CEO / CTO

### 6.1 Сценарії

#### Сценарій A: Залишитись на React Native (статус-кво)

**Коли обрати:**
- Команда має сильний RN-досвід
- Поточний додаток стабільний, нових платформ (web/desktop) не потрібно
- Обмежений бюджет — немає ресурсів на міграцію

**Ризики:**
- React Native 0.73 потребуватиме оновлення (нові версії iOS/Android breaking changes)
- Metro bundler повільніший за Dart compiler
- Fragmentation community пакетів

#### Сценарій B: Міграція на Flutter (повна)

**Коли обрати:**
- Планується веб-версія (клієнтський портал) — Flutter Web дає **80%+ код reuse**
- Планується десктоп-версія для адмінів (Windows/macOS)
- Команда готова інвестувати 2-3 місяці в міграцію
- Важлива анімаційна плавність та performance

**Виграш:**
- Єдиний код для mobile + web + desktop
- Кращий performance (Skia/Impeller)
- Строга типізація Dart (менше runtime bugs)
- Google активно інвестує у Flutter (нові платформи, Fuchsia)

**Ризики:**
- 2-3 місяці без нових фіч (фокус на міграції)
- Потрібен Dart/Flutter досвід (навчання команди)
- Flutter Web ще не ідеальний для SEO (додаток не потребує SEO)

#### Сценарій C: Поступова міграція (гібридний підхід) ⭐ РЕКОМЕНДОВАНО

**Стратегія:**
1. **Фаза 1 (1-2 тижні):** Створити Flutter MVP лише для клієнтської частини (без адмінки)
2. **Фаза 2 (2-3 тижні):** Паралельно додати Flutter Web для порталу клієнтів
3. **Фаза 3 (3-4 тижні):** Перенести адмін-панель
4. **Фаза 4 (1 тиждень):** A/B тестування, зворотний зв'язок
5. **Фаза 5:** Вимкнення React Native після стабілізації

**Переваги:**
- Поступовий перехід з мінімальним ризиком
- Можливість отримати Flutter Web версію раніше
- Паралельна робота — не блокує розробку нових фіч у RN

### 6.2 Кінцева рекомендація

> **Рекомендовано Сценарій C (поступова міграція на Flutter)**

**Обґрунтування:**

1. **Flutter Web** — критична перевага для юридичного бізнесу. Клієнти частіше використовують веб-портали, ніж встановлюють додатки. Flutter дає можливість розширитися на веб без окремої команди.

2. **Performance** — юридичні додатки працюють з великими PDF, зображеннями, документами. Flutter/Skia рендеринг ефективніший для таких задач.

3. **Команда:** Як Flutter Developer agent, я готовий вести цей перехід. Потрібен додатковий 1-2 розробники для оптимального темпу.

4. **Бізнес-ризик:** LexTrack працює у строгій ніші (юридичні послуги в Україні). Будь-який простій у розробці — це втрачені клієнти. Поступовий перехід мінімізує цей ризик.

---

## 7. Додаткові зауваження

### 7.1 Що потрібно уточнити

1. Чи планується веб-версія клієнтського порталу? (Це ключовий аргумент на користь Flutter)
2. Який розмір команди? (1 FTE = 8-12 тижнів; 2 FTE = 5-7 тижнів)
3. Чи є термінові фічі в дорожній карті? (Впливає на можливість freeze для міграції)
4. Цільові платформи: лише mobile, або також web/desktop?

### 7.2 Технічний борг React Native

- React Native 0.73.6 — не остання версія (0.74+ вже доступна)
- Мікс `.js` та `.ts` файлів — ненадійна типізація
- Кастомні нативні модулі (security, jailbreak) — потребують manual maintenance при оновленні RN
- Metro bundler — менш оптимізований порівняно з новими bundler (Re.Pack, Expo)

---

*Звіт підготовлено агентом Flutter Developer (d5984908-59ab-4d7a-88e8-705c1ca83a4d) для LexTrack / АБ Лукашенко Є.О.*
