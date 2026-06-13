# LexTrack Backend Audit Report (MYA-9)
**Агент:** CTO (def7fe2c-00be-48d5-b025-9062c97827a0)
**Дата:** 2026-06-13
**Статус:** Завершено

---

## 1. Структура functions/

| Елемент | Оцінка |
|---------|--------|
| TypeScript (src/*.ts) | Добре — 15 файлів |
| Тести (__tests__/*.test.ts) | Добре — 11 тестових файлів |
| Покриття (coverage threshold 80%) | Гарне |
| tsconfig.json | strict: true, target es2017 |
| Білд | tsc → lib/ |

### Залежності
- `firebase-admin` ^12.0.0 — стабільна LTS
- `firebase-functions` ^5.0.0 — актуальна
- `node-fetch` ^2.7.0 — legacy, рекомендую ^3.x
- `@babel/*` у `dependencies` (а не devDeps) — помилка

---

## 2. Firestore Security Rules — Аудит

### Вразливості та помилки

#### БЛОКЕР-1: Відсутній захист на читання колекції `clients`
`isLawyer()` дозволяє читання ВСІХ документів `clients/{clientId}` адвокату. Це є розумним для CRM, але потрібен аудит читання.

#### БЛОКЕР-2: `registry_cache` — будь-який автентифікований користувач може писати/читати
```
match /registry_cache/{docId} {
  allow read, write: if isAuth();
}
```
Ризик: poisoning кешу реєстру. Рекомендація: обмежити write до `isLawyer()`.

#### Критично: Messages — `allow delete: if isLawyer()`
Адвокат може видалити будь-яке повідомлення будь-якого клієнта. Рекомендація: `allow delete: if false` або soft-delete.

#### Критично: `inquiries` — `allow delete: if false` — добре, але відсутній rate-limit на створення на рівні Rules (тільки Cloud Functions має rate limit).

### Позитиви
- Документи — валідовані required fields
- Enum validation на status, from, actor
- `isDocSizeValid()` обмежує writeSize ≤ 512KB
- PaymentOrders, auditLogs — `allow create/update: if false` (тільки сервер)
- Storage rules перевіряють `isScanned()` перед читанням

---

## 3. Storage Rules — Аудит

### Вразливості

#### БЛОКЕР-3: `isScanned()` = true необхідний для читання документів
```
allow read: if (isLawyer() || isOwner(clientId)) && isScanned();
```
Це означає що клієнт НЕ може прочитати файл поки не пройде сканування. Якщо VirusTotal API недоступний — файли стають недоступними.

#### Помилка: fallback email "lawyer@example.com" у production?
```
request.auth.token.email == "lawyer@example.com"
```
Хардкод для emulator. У production це дає backdoor для будь-кого з цим email.

### Позитиви
- Обмеження розміру 25MB
- Перевірка contentType (images, PDF, Office, txt)
- Default deny на все інше

---

## 4. firebase.json — Налаштування

| Елемент | Статус |
|---------|--------|
| Firestore emulator: 127.0.0.1:8082 | Добре |
| Functions emulator: :5003 | Добре |
| Storage emulator: 127.0.0.1:9201 | Добре |
| UI emulator: disabled | Добре |
| singleProjectMode: true | Добре |

---

## 5. CI/CD — GitHub Actions

### deploy-cloud-functions.yml
- Проблема: `firebase deploy --only functions --project default` без `firebase.json` валідації
- Немає smoke-тестів перед деплоєм
- Firebase token через secrets — добре

### deploy-firebase-rules.yml
- `node-version: 18` (не 20 як functions) — невідповідність
- Немає `firebase deploy --dry-run` перед деплоєм

---

## 6. Функції — Детальний огляд

| Функція | AppCheck | Auth | Проблеми |
|---------|----------|------|----------|
| submitInquiry | Так | Ні (public) | Rate limit OK, Turnstile OK |
| getAdminMessagesSummary | Так | Так | Читає всіх клієнтів — прийнятно для CRM |
| searchEdr/Court/Enforcement | Так | Ні | Немає role check! Будь-хто з AppCheck може сканувати реєстр |
| scanDocument | Так | Так | Lawyer OR owner — добре |
| createSignSession | Так | Так | Немає lawyer check (будь-який auth може створити) |
| completeSignSession | Так | Так | Немає перевірки чи auth.uid == createdBy |
| signDocument | Так | Так | Добре — assignedLawyers / caseOwner check |
| initiate/exchange/getKEPAuth | Так | Так | Добре — lawyer check через auth |
| notifyOn* (triggers) | Н/A | Н/A | Пуш-повідомлення — добре, fallback на legacy token |
| onDocumentUpload (trigger) | Н/A | Н/A | Сканування на віруси — OK, але VirusTotal fallback |
| writeAuditLog | Так | Так | Добре — валідація полів |

### БЛОКЕР-4: Registry callable functions — відсутній role check
`searchEdr`, `searchCourt`, `searchEnforcement`, `searchOpendatabot` — вимагають лише `context.auth`, але не перевіряють `isLawyer()`. Клієнт може сканувати реєстр.

### БЛОКЕР-5: `searchOpendatabot` — alias на `searchEdrHandler`
```
export const searchOpendatabot = functions...onCall(searchEdrHandler);
```
Це помилка — має бути окремий handler для Opendatabot.

### БЛОКЕР-6: VirusScan fallback — небезпечний
```
if (!apiKey) {
  scanned = true;
  scanStatus = 'clean';
}
```
При відсутності VIRUSTOTAL_API_KEY всі файли позначаються як clean. Це критично для production.

### БЛОКЕР-7: `scanFile` з `Buffer.alloc(0)`
Коли `buffer` undefined і немає `sha256`, функція отримує `Buffer.alloc(0)` та рахує hash від порожнього буфера.

---

## 7. Список Блокерів

| # | Блокер | Сeverity | Дія |
|---|--------|----------|-----|
| B1 | `registry_cache` write дозволено будь-якому auth | Medium | Обмежити до isLawyer() |
| B2 | Storage `isScanned()` блокує читання до сканування | High | Дозволити читання lawyer, isScanned тільки для client |
| B3 | Storage fallback email "lawyer@example.com" | Critical | Видалити перед production |
| B4 | Registry functions без role check | High | Додати isLawyer() |
| B5 | searchOpendatabot = searchEdrHandler | Medium | Створити окремий handler |
| B6 | VirusScan fallback marks all clean | Critical | Якщо немає API key — scanStatus='pending' |
| B7 | scanFile з Buffer.alloc(0) | Medium | Викидати error при відсутності buffer і hash |
| B8 | Messages allow delete: isLawyer() | Medium | Заборонити видалення або soft-delete |

---

## 8. Рекомендації (non-blocking)

1. **node-fetch** → v3 (ESM) або вбудований `fetch` (Node 20+)
2. **@babel/*** перенести з dependencies → devDependencies
3. Додати `firebase deploy --dry-run` в CI
4. Додати smoke-тести після деплою (health check callable)
5. Включити App Check на Firestore emulator для E2E тестів
6. Додати `functions.https.onCall` rate limiting на рівні Firebase (runWith не обмежує rate)
7. Оновити node-version в rules workflow до 20
8. Додати `npm audit` в CI pipeline

---

## 9. Вердикт

**Рівень безпеки:** Середній (Medium)
- Правила базові, але є лазівки
- Критичні блокери: B3 (storage backdoor email), B6 (virus scan bypass)
- Структура коду добра, TypeScript з strict mode
- Тести є, coverage threshold 80%
- CI/CD базовий, потребує hardening

**Рекомендація:** Виправити B3 та B6 перед production release.
