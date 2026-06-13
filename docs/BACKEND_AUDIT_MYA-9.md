# Технічний аудит backend та Firebase-функцій LexTrack
## Issue: MYA-9 | Executor: Backend Developer | Дата: 2025-06-13

---

## 1. Структура functions/

```
functions/
├── package.json          # Node 20, TypeScript, firebase-admin ^12, firebase-functions ^5
├── tsconfig.json         # strict=true, target=es2017, rootDir=src, outDir=lib
├── jest.config.js        # Тестове налаштування
├── index.js              # LEGACY — CommonJS entry point, ініціалізує admin.initializeApp()
├── __tests__/            # 11 тестових файлів (TS)
└── src/                  # TypeScript source (17 файлів)
    ├── index.ts          # Головний barrel — реекспортує всі Cloud Functions
    ├── types.d.ts        # Типізація node-fetch
    ├── auditLog.ts       # Callable: запис audit log
    ├── caseEvents.ts     # Firestore triggers: події у справах
    ├── documents.ts      # Callable: сканування документів
    ├── inquiries.ts      # Callable: публічне звернення + Turnstile + rate limit
    ├── inspections.ts    # Firestore triggers: перевірки + звернення → push
    ├── kepAuth.ts        # Callable: OAuth id.gov.ua (PKCE, refresh)
    ├── messages.ts       # Firestore triggers: чат, unreadCount, push
    ├── push.ts           # FCM push з retry + dead-letter queue
    ├── signatures.ts     # Callable: створення/завершення сесії підпису, signDocument
    ├── storageTriggers.ts # Storage.onFinalize: автоматичне сканування файлів
    ├── virusScan.ts      # VirusTotal інтеграція
    └── registry/
        ├── common.ts     # Cache (Firestore), httpGet, assertAppCheck
        ├── court.ts      # Callable: судові рішення (reyestr.court.gov.ua)
        ├── edr.ts        # Callable: ЄДР/Opendatabot
        └── enforcement.ts # Callable: виконавчі провадження (minjust.gov.ua)
```

**Висновок:** Структура логічна, модульна. Кожна доменна область ізольована.

---

## 2. Залежності (functions/package.json)

| Пакет | Версія | Примітка |
|-------|--------|----------|
| firebase-admin | ^12.0.0 | Актуальна (v13 вже вийшла, але 12 ще підтримується) |
| firebase-functions | ^5.0.0 | Актуальна |
| node-fetch | ^2.7.0 | Використовується у kepAuth, signatures, inquiries |
| typescript | ^5.9.3 | Попередній/неіснуючий реліз — **не існує в npm**. Актуальна 5.8.x або 5.7.x. Це **блокер збірки** |
| jest | ^30.3.0 | Не існує — актуальна 29.x. **Блокер збірки** |
| ts-jest | ^29.4.9 | Нормальна, але несумісна з jest 30 (якщо б він існував) |

**БЛОКЕР:** `typescript ^5.9.3` — версії 5.9 не існує в npm (остання stable 5.8.x).
**БЛОКЕР:** `jest ^30.3.0` — jest 30 ще не випущений (останній stable 29.x).

**Рекомендація:**
```json
"typescript": "~5.7.3"
"jest": "^29.7.0"
"ts-jest": "^29.1.2"
```

---

## 3. Аудит firestore.rules

### 3.1 Загальна оцінка: **Добре**, є кілька зауважень

### 3.2 Сильні сторони
- **Валідація полів:** `keys().hasAll()`, типові перевірки (`is string`, `is number`)
- **Enum валідація:** caseStatus, invoiceStatus, messageFrom тощо
- **isDocSizeValid()** — обмеження розміру запису (512 KB)
- **paymentOrders / auditLogs** — `allow create, update: if false` (тільки сервер)
- **inquiries** — публічний create з валідацією, але лише lawyer може читати/оновлювати

### 3.3 Потенційні вразливості

#### Вразливість 1: `registry_cache` — занадто широкі права
```
match /registry_cache/{docId} {
  allow read, write: if isAuth();
}
```
Будь-який автентифікований користувач може **перезаписати** кеш реєстру іншого користувача.

**Рекомендація:** Додати `request.auth.uid == docId` або розділити кеш по користувачам.

#### Вразливість 2: Клієнт може оновлювати свій профіль — але які саме поля?
```
allow update: if (isLawyer() || isOwner(clientId))
              && request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])
```
Тут `isOwner(clientId)` — так, клієнт може оновлювати власний профіль. Це ок, але переконайтеся, що `lawyerId` або `assignedLawyer` не входять у `hasOnly` — наразі там `['name', 'phone', 'email', 'address', 'updatedAt']`. Ок.

#### Вразливість 3: Відсутність rate limiting на Firestore рівні
Хоча `inquiries.ts` має rate limit на callable, самі Firestore rules не захищають від спаму створенням повідомлень чи документів.

#### Вразливість 4: `isLawyer()` — N+1 запит при кожній перевірці
```
function isLawyer() {
  return isAuth() && exists(/databases/$(database)/documents/lawyers/$(request.auth.uid));
}
```
Це виконує запит до Firestore на **кожен** read/write. Це прийнятно для rules, але створює навантаження.

#### Вразливість 5: Підписи (signatures) — відсутня валідація documentId у create
```
allow create: if isLawyer()
              && request.resource.data.keys().hasAll(['documentId', 'status'])
              && request.resource.data.documentId is string
              && request.resource.data.status in ['pending', 'signed', 'failed', 'cancelled']
```
Немає перевірки, що `documentId` відповідає `documentId` у шляху. Це дозволяє створити підпис з `documentId` іншого документа.

**Рекомендація:** Додати `request.resource.data.documentId == documentId`.

---

## 4. Аудит storage.rules

### 4.1 Загальна оцінка: **Добре, із зауваженням**

### 4.2 Сильні сторони
- Обмеження розміру файлу: 25 MB (`isFileSizeValid()`)
- Валідація contentType (image, PDF, Word, Excel, text)
- Перевірка `isScanned()` перед читанням документів клієнта
- Default deny (`match /{allPaths=**} { allow read, write: if false; }`)

### 4.3 Потенційні вразливості

#### Вразливість 1: `isScanned()` — файли недоступні до сканування
```
allow read: if (isLawyer() || isOwner(clientId)) && isScanned();
```
Якщо файл ще не просканований (або сканування не вдалося), клієнт/адвокат **не може** його прочитати. Це може створити UX-проблему: файл завантажено, але не видно.

**Рекомендація:** Дозволити читання непросканованих файлів адвокату, або додати fallback.

#### Вразливість 2: Fallback email у `isLawyer()`
```
request.auth.token.email == "lawyer@example.com"
```
Це коментар "для емулятора", але якщо це потрапить у production — будь-хто з email `lawyer@example.com` отримає доступ.

**Рекомендація:** Видалити fallback перед production деплоєм.

---

## 5. Аудит firebase.json

```json
{
  "emulators": {
    "firestore": {"host": "127.0.0.1", "port": 8082},
    "functions": {"port": 5003},
    "storage": {"host": "127.0.0.1", "port": 9201},
    "ui": {"enabled": false, "port": 4002},
    "singleProjectMode": true
  }
}
```

- **UI emulator вимкнено** — це добре для headless CI
- **singleProjectMode** — ок для локальної розробки
- **Auth emulator відсутній** — якщо потрібна локальна розробка з OAuth/KEP, знадобиться `auth` emulator
- **Functions port 5003** — нестандартний (звичайно 5001). Це навмисно, але може заплутати.

---

## 6. Аудит CI/CD (.github/workflows/)

### 6.1 deploy-cloud-functions.yml
- **Node 20** — актуальний LTS
- `npm ci` → `npm run build` → deploy
- **Проблема:** Dry-run умова некоректна
  ```yaml
  if: github.ref != 'refs/heads/main' || github.event_name == 'workflow_dispatch'
  ```
  Це виконує deploy (не dry-run) на всіх гілках, крім main. Назва step'а "Dry-run deploy", але він **дійсно деплоїть**.

- **Відсутня стадія тестування:** Жоден workflow не запускає `npm test` перед деплоєм.

### 6.2 deploy-firebase-rules.yml
- Node 18 — застарілий (Node 20 рекомендовано)
- Відсутня валідація rules (`firebase deploy --only firestore:rules` не запускає тести)

**Рекомендація:** Додати `firebase emulators:exec --only firestore "npm test"` або `@firebase/rules-unit-testing`.

---

## 7. Аудит TypeScript коду (src/)

### 7.1 Подвійна ініціалізація admin
- `src/index.ts` рядок 3: `admin.initializeApp();`
- `index.js` (legacy) рядок 4: `admin.initializeApp();`

Якщо `index.js` використовується як entry point — це викличе помилку, бо admin вже ініціалізовано в залежностях (src/index.ts імпортується з src).

**БЛОКЕР:** Legacy `index.js` конфліктує з `src/index.ts` як entry point. `firebase.json` вказує `"source": "functions"`, що використовує `package.json` → `"main": "lib/index.js"` — тобто збирається з TypeScript. Але root `index.js` (не в functions/) також ініціалізує admin для React Native.

### 7.2 Відсутня обробка помилок у registry/common.ts
- `httpGet` використовує native `https` модуль без retry
- `fetchJson` не має timeout обробки (хоча httpGet має 15s timeout)

### 7.3 Потенційна race condition в messages.ts
```typescript
await clientRef.update({unreadCount: admin.firestore.FieldValue.increment(1)});
```
Немає транзакції — якщо два повідомлення створюються одночасно, increment працює атомарно в Firestore, тому це ок. Але `lastMessageAt` може бути перезаписаний не у хронологічному порядку (залежно від затримки push-функції).

### 7.4 Відсутня валідація URL у registry модулях
- `court.ts`, `edr.ts`, `enforcement.ts` — дані з зовнішніх API записуються у Firestore cache без санітизації
- `raw: item` — зберігає весь необроблений об'єкт API

**Ризик:** Якщо зовнішній API поверне неочікувану структуру, cache може зайняти більше місця, ніж очікується.

### 7.5 KEP Auth (kepAuth.ts)
- **PKCE implementation:** Коректний (code_verifier 128 bytes → base64url, SHA256 challenge)
- **State storage:** Зберігається у Firestore з TTL 10 хвилин
- **Проблема:** `expiresAt` обчислюється як `Date.now() + 10*60*1000` на сервері, але Firestore Timestamp записується через `serverTimestamp()` — потенційний drift між expiresAt та createdAt.

### 7.6 Signatures (signatures.ts)
- **`signDocumentHandler`** — складна функція (465 рядків). Рекомендується розбити на менші хелпери.
- **Критична помилка:** `callIdGovUaSign` викликає API endpoint `https://id.gov.ua/api/v1/sign`, який **не існує** у публічній документації id.gov.ua. Це placeholder/фейковий endpoint.
- **Реальний підпис:** У реальності id.gov.ua не підтримує remote signing через REST API таким чином. Потрібен або Qualified Signature Provider (НУЦ КІ), або Diia SDK.

---

## 8. Тести (__tests__/)

- 11 тестових файлів покривають основні модулі
- Відсутній `npm install` → тести не запускалися локально
- `jest.config.js` та tsconfig — налаштовані
- **Блокер:** Невірні версії jest/typescript не дозволять запустити тести

---

## 9. Список БЛОКЕРІВ (критичних)

| # | Блокер | Серйозність | Файл |
|---|--------|-------------|------|
| B1 | `typescript ^5.9.3` не існує в npm | **CRITICAL** | functions/package.json |
| B2 | `jest ^30.3.0` не існує в npm | **CRITICAL** | functions/package.json |
| B3 | `index.js` (root) та `src/index.ts` обидва викликають `admin.initializeApp()` | **HIGH** | index.js, src/index.ts |
| B4 | CI workflow "Dry-run deploy" фактично виконує реальний deploy | **HIGH** | .github/workflows/deploy-cloud-functions.yml |
| B5 | `callIdGovUaSign` використовує фейковий/непідтверджений endpoint | **HIGH** | signatures.ts |
| B6 | У тестах `__tests__/signatures.test.ts` можуть бути помилки через відсутність залежностей | **MEDIUM** | — |

---

## 10. Список РЕКОМЕНДАЦІЙ

| # | Рекомендація | Пріоритет |
|---|--------------|-----------|
| R1 | Виправити versions у functions/package.json: typescript ~5.7.3, jest ^29.7.0, ts-jest ^29.1.2 | P0 |
| R2 | Видалити або оновити legacy `index.js` (root), щоб уникнути подвійної ініціалізації admin | P0 |
| R3 | Додати `npm test` у CI pipeline перед деплоєм | P1 |
| R4 | Виправити умову dry-run у deploy-cloud-functions.yml (зараз deploy на non-main) | P1 |
| R5 | Обмежити `registry_cache` writes по auth.uid або розділити по користувачам | P1 |
| R6 | Додати `request.resource.data.documentId == documentId` у signatures rules | P1 |
| R7 | Видалити fallback email `lawyer@example.com` з storage.rules перед production | P2 |
| R8 | Додати auth emulator у firebase.json для локальної розробки KEP | P2 |
| R9 | Розбити `signDocumentHandler` на хелпери (<100 рядків кожен) | P2 |
| R10 | Додати Firebase Rules Unit Testing (@firebase/rules-unit-testing) | P3 |
| R11 | Реалізувати реальний KEP signing через Diia SDK або НУЦ КІ | P3 |
| R12 | Оновити Node.js у deploy-firebase-rules.yml з 18 до 20 | P3 |

---

## 11. Резюме для CTO

**Backend LexTrack — надійний, але потребує термінових виправлень перед production деплоєм:**

- Загальна оцінка безпеки: **7/10** (добрі rules, але є витік кешу та документId у signatures)
- Загальна оцінка якості коду: **6/10** (хороша структура, але блокери версій, placeholder API)
- Загальна оцінка CI/CD: **5/10** (немає тестів перед деплоєм, некоректна dry-run умова)

**Найближчі дії:**
1. Виправити package.json (B1, B2)
2. Виправити CI dry-run (B4)
3. Аудит KEP signing endpoint (B5)
4. Видалити double init admin (B3)

---

*Звіт підготовано Backend Developer (Agent ID: 69477015-23d8-494c-8028-9a5748cfb754)*
*Project: Mobile Apps (f9091112-352d-4802-8a62-eed32f13526d)*
