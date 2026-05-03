# LexTrack Changelog

## Формат

Цей проєкт дотримується [Keep a Changelog](https://keepachangelog.com/uk/1.0.0/) та семантичного версіонування.

---

## [2.0.0] — 2026-05-03 (заплановано)

### Додано (Epics CMP-127 – CMP-135)
- **Епік 1 — Безпека та compliance**: GDPR/152 ЗУ, App Check, аудит правил Firestore.
- **Епік 2 — Дані й продуктивність**: TanStack Query, офлайн-кеш, оптимістичні оновлення, пагінація списків.
- **Епік 3 — TypeScript**: Міграція `.js` → `.ts`, типи для моделей, strict mode.
- **Епік 4 — Реальні інтеграції**: Opendatabot API, LiqPay, Google Maps.
- **Епік 5 — Сканер та OCR**: OCR-розпізнавання тексту, автообрізання, метадані PDF.
- **Епік 6 — UX, доступність та i18n**: L10n (uk/en), VoiceOver/TalkBack, анімації Reanimated 3.
- **Епік 7 — iOS**: Xcode-конфігурація, Push, App Store.
- **Епік 8 — Інженерна якість**: E2E Detox, perf monitoring, Sentry crash reports.
- **Епік 9 — Бізнес-функції**: Push сценарії, аналітика Amplitude, white-label шаблон.

### Змінено
- Повний редизайн на Palette V2: всі hardcoded стилі замінено на design tokens.
- Оновлено 18+ екранів та компонентів до токенізованої системи.

### Виправлено
- Inline hardcoded colors, font sizes, border radius у всьому фронтенді.

---

## [1.0.0] — 2026-04

### Додано
- Повний MVP: 11 клієнтських + 6 адмін-екранів.
- Firebase авторизація (Phone OTP).
- Firestore CRUD для справ, документів, рахунків, перевірок, чату.
- Firebase Storage для PDF/документів.
- FCM push-сповіщення.
- PDF-сканер (камера / галерея / файл).
- Дизайн-система v1.
- Firestore Security Rules.
- Публікація Google Play.
