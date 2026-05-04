# LexTrack Design System

## Структура файлів

| Файл / папка | Призначення |
|-------------|-------------|
| `design/tokens.json` | Джерело правди всіх токенів (кольори, типографіка, spacing, radius, shadows). Версія **3.0.0** (світла тема). Читається `src/utils/theme.js`. **Не імпортуйте напряму з екранів — використовуйте `theme.js`.** |
| `src/utils/theme.js` | Програмний шар: експортує `colors`, `spacing`, `radius`, `typography`, `shadows`, `globalStyles`. Зберігає legacy flat-поля (`colors.bg`, `colors.text`, …) для сумісності та нові семантичні ключі V3. |
| `design/palette-v2-preview.html` | Інтерактивний перегляд палітри V2 (темна тема) — legacy |
| `design/mockups-preview.html` | **Галерея всіх екранів-мокапів V3 (світла тема)**. Відкривайте в браузері. |
| `design/mockups/` | PNG-екрани додатку V3 (canonical, світла тема) |
| `design/preview/` | HTML-превʼю окремих компонентів дизайн-системи V3 (buttons, inputs, cards, colors, typography, surfaces, shadows, spacing, icons, avatars, badges, chat-bubbles, progress-tabs, stat-cards, alert-banners, logo, radius) |
| `design/README.md` | Цей файл |

## Кольорова палітра — Версія 3 (Tokens V3, Light)

### Brand
- **Primary** `#2A8FA8` — основний бірюзово-синій (аналог Pantone 7459 C). Використовуйте для CTA, акцентів, активних станів.
- **Primary Light** `#4FA9BF` — світліший варіант для hover/press.
- **Primary Dark** `#1F6F84` — темніший для фокусу / pressed.
- **Primary Muted** `rgba(42,143,168,0.12)` — фон для badges, hover-рядків.
- **Secondary** `#7C8084` — додатковий сірий (аналог Pantone 444 C). Вторинні елементи, статуси, нейтральні акценти.

### Semantic
- **success** `#4A9B6E` — позитивні статуси, inline validation OK
- **warning** `#C28B3C` — стан, що потребує уваги
- **danger** `#B84545` — помилки, деструктивні дії (завжди з undo/confirm)
- **info** `#3D7AA8` — сервісні сповіщення, help hints (Pragnanz — виділяється, не конкуруючи з brand)

Кожен semantic колір має `Bg`-аналог (10 % opacity) для банерів і бейджів.

### Neutral (Cool Light)
Побудований за 11-ступеневою шкалою від `#FFFFFF` до `#0F1011`. Використовуйте для:
- фонів (`bg` → `base` → `raised`)
- текстів (`primary` → `secondary` → `disabled`)
- бордерів (`subtle` → `default` → `strong`)

> **Aesthetic-Usability Effect** + **WCAG contrast**: типографія primary на bg дотримується контрасту > 15:1. Secondary на bg — > 6:1. Для danger/text: 4.73:1 — дотримується межі AA для звичайного тексту.

### Surfaces (Light)
| Токен | Значення | Використання |
|-------|---------|-------------|
| `bg` | `#FFFFFF` | Фон екрану |
| `base` | `#F8F9FA` | Фон секцій, альтернативні ряди |
| `raised` | `#FFFFFF` | Картки, модалки |
| `sunken` | `#F1F3F4` | Hover/pressed ряди, input-фон |
| `overlay` | `rgba(15,16,17,0.40)` | Затемнення під модалками |
| `inverse` | `#1B1D1F` | Інверсивні поверхні |

## Алерти (Alert Palette) — V3

| Роль | Основний | Текст/іконка | Фон (soft) |
|------|----------|--------------|------------|
| Error | `#B84545` | `#CF6E6E` | `rgba(184,69,69,0.10)` |
| Warning | `#C28B3C` | `#D4A865` | `rgba(194,139,60,0.10)` |
| Success | `#4A9B6E` | `#6EB48C` | `rgba(74,155,110,0.10)` |
| Info | `#3D7AA8` | `#6595BD` | `rgba(61,122,168,0.10)` |

Застосовуйте `Bg`-варіанти для `AlertBanner` та `Badge`-фонів. Основний колір — для іконок, текстів, індикаторів. Світліший — для hover/press станів (якщо підтримуються у React Native).

## Типографіка — V3

| Token | Size | Line-height | Usage |
|-------|------|-------------|-------|
| `3xl` | 34 | 44.2 | Найвищий рівень маркетінгу |
| `2xl` | 28 | 36.4 | Найвищий рівень сторінки (h1) |
| `xl` | 22 | 28.6 | Секційні заголовки (h2) |
| `lg` | 18 | 27 | Картки, форми (h3) |
| `md` | 16 | 24 | Підзаголовки, кнопки |
| `base` | 14 | 21 | Основний текст (body) |
| `sm` | 12 | 18 | Метадані, підписи (caption) |
| `xs` | 11 | 13.2 | Uppercase labels, tags |

**Фундамент unit = 4 px**. Розміри шрифтів побудовані як `11 / 12 / 14 / 16 / 18 / 22 / 28 / 34` (Chunking — різниця між сусідніми рівнями ≥ 2 px для чіткої ієрархії).

## Spacing

Unit = 4 px. Scale: 0 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64.
Legacy alias: `xs=4`, `sm=8`, `md=16`, `lg=24`, `xl=32`, `2xl=48`.

## Radius і Shadows — V3

- **Radius**: `none=0` / `sm=6` / `md=10` / `lg=16` / `xl=24` / `full=9999`. Платфорні обмеження React Native враховані.
- **Shadows**: 0–3 рівні з `elevation` (Android) та `shadowOffset/Radius` (iOS) у `tokens.json` для паритету.

## Як мігрувати

1. **Legacy flat-використання працює без змін**:
   ```js
   import {colors, spacing, radius, typography, globalStyles} from '../utils/theme';
   ```
   Legacy-ключі (`bg`, `surface`, `card`, `border`, `primary`, `text`, `muted` тощо) залишені для сумісності.

2. **Новий семантичний доступ** (рекомендовано для нових компонентів):
   ```js
   colors.semantic.success
   colors.surface.raised
   colors.text.secondary
   shadows['2'].ios.shadowRadius
   ```

3. При додаванні нової лейаут-чітки — брати значення з `tokens.json`, а не «з голови».

## Правила

- Не хардкодьте HEX поза `tokens.json`.
- Якщо потрібен новий колір — спершу додайте в `tokens.json`, потім реекспортуйте в `theme.js`.
- Для accessibility: всі semantic кольори розгорнуті як `Bg`-сполучення; не вигадайте нові opacity-комбінації в рантаймі.
- **Кольори не мають бути єдиним індикатором стану** (color-independence): поєднуйте колір з іконкою або текстом (наприклад, бейджі містять і текст, і точку-індикатор).

## Mockups та Component Previews

- `design/mockups/` — canonical PNG-мокапи екранів додатку V3 (світла тема, source of truth).
- `mockups/` — **legacy** PNG-мокапи (mirror для сумісності) — не видаляйте, але не оновлюйте.
- [`design/mockups-preview.html`](mockups-preview.html) — інтерактивна галерея всіх екранів (відкривайте локально або через raw GitHub).
- [`design/preview/`](preview/) — окремі HTML-превʼю компонентів дизайн-системи (buttons, inputs, cards, colors, typography, shadows, spacing, icons, avatars, badges, chat bubbles, progress tabs, stat cards, alert banners, logo, radius, surfaces). Корисно для ручної перевірки компонентів перед імплементацією.
