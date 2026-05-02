# LexTrack Design Tokens

## Структура токенів

| Файл | Призначення |
|------|-------------|
| `design/tokens.json` | Джерело правди всіх токенів (кольори, типографіка, spacing, radius, shadows). Читається `src/utils/theme.js`. **Не імпортуйте напряму з екранів — використовуйте `theme.js`.** |
| `src/utils/theme.js` | Програмний шар: експортує `colors`, `spacing`, `radius`, `typography`, `shadows`, `globalStyles`. Зберігає legacy flat-поля (`colors.bg`, `colors.text`, …) для сумісності з поточним кодом. |

## Кольорова палітра — Версія 2 (Palette V2)

### Brand
`#41A9A5` — бірюзово-синій primary (CMYK C:69 M:19 Y:21 K:18; Pantone 7459 C). Використовуйте для CTA, акцентів, активних станів. Має світліший `#68C4C0`, темніший `#2E8582` та прозорий muted-варіант для фонів.

### Additional
`#6A7A7C` — додатковий сірий (CMYK C:46 M:38 Y:37 K:23; Pantone 444 C). Використовуйте для вторинних елементів, статусів, нейтральних акцентів.

### Semantic
- **success** `#3CB46E` — позитивні статуси, inline validation OK
- **warning** `#E6A03C` — стан, що потребує уваги
- **danger** `#DC4B4B` — помилки, деструктивні дії (завжди з undo/confirm)
- **info** `#4696DC` — сервісні сповіщення, help hints (Pragnanz — виділяється, не конкуруючи з brand)

Кожен semantic колір має `Bg`-аналог (14 % opacity) для банерів і бейджів.

### Neutral (Cool Dark)
Побудований за 11-ступеневою шкалою від `#FFFFFF` до `#0A0D0E`. Використовуйте для:
- фонів (bg → base → raised)
- текстів (primary → secondary → disabled)
- бордерів (subtle → default → strong)

> **Aesthetic-Usability Effect** + **WCAG contrast**: типографія primary на bg дотримується контрасту > 15:1. Secondary на bg — > 6:1. Для danger/text: 4.73:1 — дотримується межі AA для звичайного тексту.

## Алерти (Alert Palette)

| Роль | Основний | Текст/іконка | Фон (soft) |
|------|----------|--------------|------------|
| Error | `#DC4B4B` | `#F07878` | `rgba(220,75,75,0.14)` |
| Warning | `#E6A03C` | `#F5BE64` | `rgba(230,160,60,0.14)` |
| Success | `#3CB46E` | `#6ED296` | `rgba(60,180,110,0.14)` |
| Info | `#4696DC` | `#82B9EB` | `rgba(70,150,220,0.14)` |

Застосовуйте `Bg`-варіанти для `AlertBanner` та `Badge`-фонів. Основний колір — для іконок, текстів, індикаторів. Світліший — для hover/press станів (якщо підтримуються у React Native).

## Типографіка

| Token | Size | Line-height | Usage |
|-------|------|-------------|-------|
| `h1` | 28 | 33.6 | Найвищий рівень сторінки |
| `h2` | 22 | 28.6 | Секційні заголовки |
| `h3` | 18 | 27 | Картки, форми |
| `body` | 14 | 21 | Основний текст |
| `caption` | 12 | 18 | Метадані, підписи |
| `label` | 11 | 13.2 | Uppercase labels, tags |

**Фундамент unit = 4 px**. Розміри шрифтів побудовані як `11 / 12 / 14 / 16 / 18 / 22 / 28 / 34` (Chunking — різниця між сусідніми рівнями ≥ 2 px для чіткої ієрархії).

## Spacing

Unit = 4 px. Scale: 0 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64.
Legacy alias: `xs=4`, `sm=8`, `md=16`, `lg=24`, `xl=32`.

## Radius і Shadows

- **Radius**: 6 / 10 / 16 / 24 / 9999 (full). Платфорні обмеження React Native враховані.
- **Shadows**: 0–3 рівні з `elevation` (Android) та `shadowOffset/Radius` (iOS) у tokens.json для паритету.

## Як мігрувати

1. **Legacy flat-використання працює без змін**:
   ```js
   import {colors, spacing, radius, typography, globalStyles} from '../utils/theme';
   ```
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

## Mockups

- `mockups/` — усі PNG-мокапи екранів додатку.
- [`design/mockups-preview.html`](mockups-preview.html) — інтерактивна галерея всіх екранів у браузері (відкривайте локально або через GitHub Pages).
