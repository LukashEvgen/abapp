# Технічний аудит Backend та Firebase-функцій LexTrack
## Issue: MYA-9 | Дата: 2026-06-13 | Аудитор: Backend Developer

---

## 1. Структура functions/ (4718 рядків TS)

### Архітектура
```
functions/
├── src/
│   ├── index.ts              — точка входу, експорт усіх функцій
│   ├── auditLog.ts           — логування дій (callable)
│   ├── caseEvents.ts         — push-тригери подій справи
│   ├── documents.ts          — сканування документів (callable + virusScan)
│   ├── inquiries.ts          — публічна форма звернень (callable)
│   ├── inspections.ts        — push-тригери перевірок / звернень
│   ├── kepAuth.ts            — OAuth КЕП (id.gov.ua): initiate / exchange / getToken
│   ├── messages.ts           — push-тригери повідомлень + оновлення unreadCount
│   ├── push.ts               — FCM відправка з retry + dead-letter
│   ├── signatures.ts         — підписання документів через КЕП
│   ├── storageTriggers.ts    — автоматичне сканування після upload
│   ├── virusScan.ts          — VirusTotal інтеграція (опціонально)
│   ├── types.d.ts            — глобальні типи
│   └── registry/
│       ├── common.ts         — кеш, HTTP-helpers, assertAppCheck
│       ├── court.ts          — судовий реєстр (Reyestr)
│       ├── edr.ts            — ЄДР (Opendatabot)
│       └── enforcement.ts    — виконавчі провадження
├── __tests__/                — 9 тестових файлів (Jest, coverage threshold 80%)
├── package.json              — Node 20, TS 5.9
├── tsconfig.json             — strict=true, noUnusedLocals=true
└── jest.config.js            — coverage threshold: 80% branches/functions/lines/statements
```

### Залежності
- `firebase-admin@^12.0.0` — OK
- `firebase-functions@^5.0.0` — OK
- `node-fetch@^2.7.0` — legacy, deprecated (див. блокери)
- `@babel/preset-env`, `@babel/preset-typescript`, `babel-jest` — dev
- `jest@^30.3.0`, `ts-jest@^29.4.9` — OK
- `@types/node@^18.0.0` — Node 18 types при Node 20 runtime — не критично, але рекомендується `@types/node@^20`

---

## 2. Firestore Rules — Аудит

### Загальне враження
Правила написані ретельно, з валідацією полів, enum-значень, розміром документа та перевіркою ролі адвоката.

### Потенційні проблеми

| # | Проблема | Рівень | Опис |
|---|----------|--------|------|
| F1 | `registry_cache` дозволяє read/write всім автентифікованим | MEDIUM | `match /registry_cache/{docId} { allow read, write: if isAuth(); }` — будь-який автентифікований користувач може перезаписати кеш реєстру іншого користувача. Рекомендація: обмежити write на основі uid або role |
| F2 | `paymentOrders` read — клієнт бачить лише свій, але немає валідації на create/update (тільки server-side через `if false`) | LOW | OK для поточної архітектури, але якщо функція створює замовлення без валідації clientId — можливий логічний баг |
| F3 | `isDocSizeValid()` використовує `request.writeSize` — це невірна змінна в Firestore Rules v2 | HIGH | `request.writeSize` НЕ існує в Firestore Security Rules. Валідація розміру документа не працює. Потрібно видалити або замінити на інший підхід. |
| F4 | `isOwner(clientId)` порівнює `request.auth.uid == clientId` — клієнт може читати свої дані, але `clientId` генерується системою? Якщо клієнт може передати довільний `clientId` у запиті — це може бути проблемою. У Firestore Rules `clientId` береться з шляху документа, тому це безпечно. | LOW | Немає проблеми — safe |
| F5 | `messages` allow create: клієнт може створювати повідомлення від імені `lawyer` якщо поле `from` не валідується на рівні сервера | MEDIUM | В правилах `isValidMessageFrom` перевіряє що `from in ['client','lawyer','system']`, але НЕ перевіряє що `from == 'client'` для клієнта. Клієнт може створити повідомлення з `from='lawyer'` і таким чином підробити відправника. Рекомендація: додати перевірку `isOwner(clientId) => request.resource.data.from == 'client'` |
| F6 | `clients` allow update: `diff(resource.data).affectedKeys().hasOnly([...])` — це добре, але `isOwner(clientId)` може оновлювати `name`, `phone`, `email`, `address`, `updatedAt`. Немає перевірки що клієнт не змінить `lawyerId` або `assignedLawyer`. | MEDIUM | Потрібно додати `assignedLawyer` та `lawyerId` до заборонених полів для клієнта |

---

## 3. Storage Rules — Аудит

### Загальне враження
Правила обмежують доступ до документів клієнта, шаблонів адвокатів і забороняють все інше.

### Проблеми

| # | Проблема | Рівень | Опис |
|---|----------|--------|------|
| S1 | `isScanned()` перевіряє `resource.metadata.get("scanned", "false")` — але у `scanFile()` metadata встановлюється через `file.setMetadata({metadata: {scanned: ...}})` | MEDIUM | Потрібно переконатися що metadata namespace правильний. Firebase Storage metadata зберігає custom metadata як `metadata.scanned` — це має працювати, але потрібно перевірити що `resource.metadata` дійсно має це поле |
| S2 | `isLawyer()` використовує `firestore.exists()` — це cross-service query з Storage Rules до Firestore. Працює тільки у Blaze-плані і може бути повільним. | LOW | Не блокер, але варто знати про latency та billing |
| S3 | `isValidContentType()` — дозволяє `application/msword` та `application/vnd.ms-excel` (старі формати Office). Можливі CVE для цих форматів. | LOW | Рекомендація: обмежити до сучасних `.docx`/`.xlsx` або додати sandbox-сканування |
| S4 | Fallback email `lawyer@example.com` у `isLawyer()` — тестовий залишок | HIGH | Це дозволяє обійти перевірку ролі в емуляторі. У production це небезпечно якщо хтось створить обліковий запис з email `lawyer@example.com`. Видалити перед production! |

---

## 4. Firebase.json — Аудит

| # | Проблема | Рівень | Опис |
|---|----------|--------|------|
| FB1 | UI emulator disabled (`"enabled": false`) | LOW | Не зручно для локальної розробки, але не блокер |
| FB2 | Відсутній `auth` emulator | MEDIUM | Неможливо локально тестувати auth flow, що ускладнює тестування КЕП та правил безпеки |
| FB3 | Відсутні `hosting`, `extensions` | INFO | Не використовується для цього проекту — OK |
| FB4 | `singleProjectMode: true` — OK | — | Коректно для емуляторів |

---

## 5. CI/CD — Аудит

### `.github/workflows/deploy-cloud-functions.yml`
- Node 20 у deploy-functions — OK
- `npm ci` — OK
- `test` відсутній у CI pipeline! | **HIGH** — деплой без запуску тестів
- FIREBASE_TOKEN через secrets — OK
- Dry-run для non-main — OK
- Cleanup policy (30 днів) — OK
- `functions:artifacts:setpolicy` — використовує `echo "y" | ... --force` — OK

### `.github/workflows/deploy-firebase-rules.yml`
- Node 18 — неузгоджений з functions (Node 20) | **LOW**
- Відсутній етап `test` для rules (firebase emulator test) | **MEDIUM**
- FIREBASE_TOKEN через secrets — OK

---

## 6. Блокери та Критичні Проблеми

### 🔴 BLOCKER #1: `request.writeSize` у Firestore Rules — не існує
`isDocSizeValid()` використовує `!("writeSize" in request) || request.writeSize <= 524288` — це завжди поверне `true` (оскільки `request.writeSize` === `undefined`, а `"writeSize" in request` === `false`). Валідація розміру документа НЕ працює.

**Виправлення:** Видалити `isDocSizeValid()` або замінити на server-side валідацію у Cloud Functions.

### 🔴 BLOCKER #2: Fallback email `lawyer@example.com` у Storage Rules
`isLawyer()` містить `|| request.auth.token.email == "lawyer@example.com"` — це тестовий fallback для емулятора. У production це дозволяє будь-якому користувачу з таким email отримати доступ адвоката до Storage.

**Виправлення:** Видалити цей рядок перед деплоєм.

### 🟠 HIGH #3: CI/CD деплоїть без тестів
Cloud Functions workflow не запускає `npm test` перед деплоєм. Це означає що код з broken tests може потрапити у production.

**Виправлення:** Додати `npm test` перед build/deploy.

### 🟠 HIGH #4: `node-fetch@^2.7.0` — deprecated, має CVE
`node-fetch` v2 застарів. У v2 були проблеми з обробкою помилок та memory leaks. Рекомендується перейти на вбудований `fetch` (Node 18+) або `undici`.

**Виправлення:** Видалити `node-fetch` з dependencies, використовувати глобальний `fetch`.

### 🟡 MEDIUM #5: Клієнт може підробити `from='lawyer'` у messages
У Firestore Rules для `messages` немає перевірки що клієнт (isOwner) може створювати повідомлення лише з `from='client'`.

**Виправлення:** Додати умову: `isOwner(clientId) => request.resource.data.from == 'client'`.

### 🟡 MEDIUM #6: Клієнт може оновити `lawyerId` у власному профілі
`clients` update дозволяє оновлювати `name`, `phone`, `email`, `address`, `updatedAt` — але не забороняє `lawyerId` / `assignedLawyer`.

**Виправлення:** Перевірити що `affectedKeys()` не містить `lawyerId`, `assignedLawyer`, `createdAt`.

### 🟡 MEDIUM #7: Rate limit для inquiries використовує Firestore — не atomic
`checkRateLimit()` робить `get()` + `set()/update()` — race condition можлива при одночасних запитах.

**Виправлення:** Використовувати Firestore Transaction для atomic increment.

### 🟡 MEDIUM #8: `virusScan.ts` — `scanFile(Buffer.alloc(0), ...)` при відсутності буфера
`documents.ts` викликає `scanFile(buffer || Buffer.alloc(0), fileHash)`. Якщо `fileHash` відсутній і буфер порожній — `hashFromBuffer` поверне хеш порожнього буфера, що може бути помилково закешовано як "clean".

**Виправлення:** Додати перевірку що буфер не порожній перед скануванням.

---

## 7. Рекомендації (Non-blocking)

| # | Рекомендація | Пріоритет |
|---|-------------|-----------|
| R1 | Перейти з `node-fetch` на нативний `fetch` | High |
| R2 | Додати `npm test` до CI pipeline | High |
| R3 | Додати auth emulator для локального тестування | Medium |
| R4 | Додати Firebase Rules unit tests (`@firebase/rules-unit-testing`) | Medium |
| R5 | Обмежити `registry_cache` write — тільки власник кешу або server-side | Medium |
| R6 | Додати `isOwner(clientId)` перевірку для `messages.create` | Medium |
| R7 | Встановити `@types/node@^20` замість `@types/node@^18` | Low |
| R8 | Додати retry logic для `kepAuth.ts` fetch calls (id.gov.ua іноді недоступний) | Low |
| R9 | Залогувати `context.rawRequest.ip` при підозрілих запитах | Low |
| R10 | Розглянути Cloud Functions v2 для кращої продуктивності | Info |

---

## 8. Статистика
- Загальний обсяг коду: ~4718 рядків TypeScript
- Тестове покриття: 9 тест-файлів, threshold 80%
- Callable functions: 12
- Firestore triggers: 7
- Storage triggers: 1
- Зовнішні API: id.gov.ua, Opendatabot, Reyestr Court, VirusTotal, Cloudflare Turnstile
- Dead-letter collection: `failedPushes`
- Rate limiting: Firestore-based (inquiries)

---

*Звіт згенеровано автоматично. Backend Developer.*
