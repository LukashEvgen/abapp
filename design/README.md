# LexTrack Design Tokens

## Структура токенів

| Файл | Призначення |
|------|-------------|
| `design/tokens.json` | Джерело правди всіх токенів (кольори, типографіка, spacing, radius, shadows). Читається `src/utils/theme.js`. **Не імпортуйте напряму з екранів — використовуйте `theme.js`.** |
| `src/utils/theme.js` | Програмний шар: експортує `colors`, `spacing`, `radius`, `typography`, `shadows`, `globalStyles`. Зберігає legacy flat-поля (`colors.bg`, `colors.text`, …) для сумісності з поточним кодом. |

## Кольорова палітра

### Brand
`#C9A84C` — золотий primary. Використовуйте для CTA, акцентів, активних станів. Має світліші/темніші похідні та прозорий muted-варіант для фонів.

### Semantic
- **success** `#27AE60` — позитивні статуси, inline validation OK
- **warning** `#D4831A` — небезпечний стан, потребує уваги
- **danger** `#C0392B` — помилки, деструктивні дії (завжди з undo/confirm)
- **info** `#4A90D9` — сервісні сповіщення, help hints (Pragnanz — виділяється, не конкуруючи з brand)

Кожен semantic колір має `Bg`-аналог (15 % opacity) для банерів і бейджів.

### Neutral (Olive Dark)
Побудований за 11-ступеневою шкалою від `#FFFFFF` до `#0C0F0A`. Використовуйте для:
- фонів (bg → base → raised)
- текстів (primary → secondary → disabled)
- бордерів (subtle → default → strong)

> **Aesthetic-Usability Effect** + **WCAG contrast**: типографія primary на bg дотримується контрасту > 12:1. Secondary на bg — > 4.5:1.

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

- **Radius**: 6 / 10 / 16 / 24 / 9999 (full). Платформні обмеження React Native враховані.
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
