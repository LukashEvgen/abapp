# LexTrack Design System

**LexTrack** — мобільний додаток для юридичного трекінгу (React Native 0.73 + Firebase) для адвокатського бюро та його клієнтів. Дозволяє юристам керувати клієнтами, справами, документами та рахунками, а клієнтам — відстежувати свої справи, переглядати документи, рахунки і спілкуватися з адвокатом.

> Created for: **створення юридичного додатку для смартфонів для адвокатського бюро та його клієнтів**

## Sources

- **Codebase**: [`LukashEvgen/abapp`](https://github.com/LukashEvgen/abapp) (React Native 0.73.6) — imported into `src/`, `mockups/`
- **Design tokens**: [`design/tokens.json`](https://github.com/LukashEvgen/abapp/blob/main/design/tokens.json) — Palette V2 (canonical, source of truth)
- **Brand business card** (`uploads/palitra.pdf`): canonical brand identity — Pantone **7459 C** teal as primary, Pantone **444 C** as secondary neutral, on white. The teal-knight logo and the light theme are sourced from this artifact.
- **PNG mockups**: 21 screen mockups in `mockups/` — high-fidelity but rendered against the **legacy V1 gold** palette. The codebase has migrated to **V2 teal**, and the brand identity finalized as Pantone 7459 C — that is what this design system uses.

## Products

This is **a single mobile product** (React Native, ships to Android + iOS) with two roles served by one codebase:

| Role | Surface | Key screens |
|---|---|---|
| **Адміністратор (юрист)** | Admin tab nav | Дашборд · Клієнти · Справи · Рахунки · Чат |
| **Клієнт** | Client tab nav | Дашборд · Мої справи · Документи · Рахунки · Перевірки · Реєстри · Бюро · Чат |

Both share: `LoginScreen` (phone OTP via Firebase Auth) and `ChatScreen`.

## Index

| File | What lives here |
|---|---|
| `README.md` | This file — system overview, content + visual foundations, iconography |
| `SKILL.md` | Cross-compatible Agent Skill manifest |
| `colors_and_type.css` | All CSS variables: brand, semantic, neutral scale, surface, border, text, spacing, radius, shadow, typography |
| `assets/` | Logos, mockup PNGs (21 screens) referenced by the UI kit & previews |
| `ui_kits/lextrack_app/` | High-fidelity click-thru recreation of the mobile app — `index.html` + per-component JSX |
| `preview/` | Design System tab cards (palette, type, components, etc.) |
| `src/` *(read-only reference)* | The original React Native source — theme, helpers, components, screens. **Do not edit; this is a snapshot for design context.** |
| `mockups/` *(read-only reference)* | Original PNG mockups from the codebase |
| `design/` *(read-only reference)* | Original tokens.json + V2 palette preview HTML |

---

## Content Fundamentals

**Language**: Ukrainian (Українська). All UI copy is in Ukrainian. Labels, errors, alerts, button text — all Ukrainian.

**Tone**: Formal-professional. This is a legal product; copy is dry, factual, never cute. No exclamation marks, no marketing voice. Errors are direct: "Невірний код", "Помилка зʼєднання", "Немає активних справ". Greetings on the dashboard are warm but brief: "Привіт, Олексій 👋".

**Address form**: "Ви" (formal you). The product addresses both the client and the lawyer respectfully. Examples from the codebase:
- `Введіть номер телефону для входу` — "Enter your phone number to log in" (formal imperative)
- `Введіть код з SMS` — "Enter the SMS code"
- `Введіть назву` / `Введіть категорію` — placeholder pattern

**Casing**: Sentence case for everything except labels. UPPERCASE is reserved for `.lt-label` micro-tags ("ХРОНОЛОГІЯ ПОДІЙ", "ШВИДКИЙ ДОСТУП", "АКТИВНІ СПРАВИ"). Buttons are sentence case: "Надіслати код", "Документи справи", "Підтвердити".

**Emoji usage** — yes, sparingly, for **functional iconography only** (not decoration):
- Domain icons in dashboards: ⚖ Справи · 🔍 Перевірки · 💰 Рахунки · 🗂 Реєстри · 👨‍⚖️ Бюро · 💬 Чат · 📄 Документи
- Greeting flourish: 👋 ("Привіт, Олексій 👋")
- Alert prefixes in mockup copy: ❌ ⚠️ ✅ ℹ️ (in `palette-v2-preview.html`)

**Numbers / formatting**:
- Currency: `₴` symbol prefixed, thousands separator is space (`uk-UA` locale): `₴24 500`, `₴8 000`. See `formatCurrency` in `src/utils/helpers.js`.
- Dates: `dd MMM yyyy` format with Ukrainian month names via `date-fns/locale/uk`: `12 трав 2025`. Hearings show as `12.03.2025 10:00` in event timelines.
- Case numbers: `№ 761/2024` (Cyrillic numero sign + slash year).
- Phone: `+380 67 904 09 72` (E.164 with spacing).

**Status vocabulary** (statuses are localized strings, not enums):
- Cases: `Розглядається` (under review · gold), `Очікує рішення` (awaiting · warning), `Вирішено` (resolved · success)
- Invoices: `pending` · `paid` · `overdue`
- Risk levels: `low` · `medium` · `high` · `critical`

**Empty states**: One short phrase, no illustration: "Немає активних справ", "Немає рахунків". Empty state component supports `icon + title + subtitle` but the brand uses it sparingly.

**Microcopy examples**:
- Search placeholders: `Пошук за назвою, номером, судом...`, `Пошук за іменем або телефоном...`
- Composer placeholder: `Повідомлення...`
- Error toast: `Не вдалося надіслати SMS`, `Невірний код`

---

## Visual Foundations

### Theme
**Light theme.** Page background is `#FFFFFF`. Surfaces step *up* from white to faintly grey: `bg #FFFFFF → base #F8F9FA → sunken #F1F3F4`. Cards stay on `#FFFFFF` and gain depth via 1 px hairline borders + soft shadows.

### Color motif
Muted teal brand (Pantone **7459 C** ≈ `#2A8FA8`) on cool greys, with Pantone **444 C** (`#7C8084`) as a secondary neutral for ghost surfaces and supporting type. The palette deliberately reads as **calm, professional, trustworthy** — appropriate for a legal product handling sensitive cases. Avoid warm accents; never introduce purple/pink/orange outside the documented semantic colors.

### Typography
- **Single sans family** (system / Inter substitute on web). No serif, no display face.
- **Scale**: 11 / 12 / 14 / 16 / 18 / 22 / 28 / 34 — chunked so adjacent steps differ by ≥ 2px.
- **Weights used**: 400 regular, 500 medium, 600 semibold, 700 bold, 800 black (logo only).
- **Letter-spacing**: `wide` (+0.5) on h1/h2 for a slight legal-doc gravitas; `wider` (+1.2) on uppercase labels.
- **Line-height**: tight 1.2 / snug 1.3 / normal 1.5. Body text is 1.5.

### Spacing
Unit = **4 px**. Scale `0/4/8/12/16/20/24/32/40/48/64`. Cards have internal padding of 16, gaps of 16 between cards. Touch targets ≥ 44 px.

### Backgrounds
**Flat solid colors only.** No gradients, no images, no patterns, no textures. Depth comes from elevating surfaces by one or two neutral steps (`bg → base → sunken`) plus 1 px hairlines and soft `shadow-1`.

### Borders
1 px hairlines using `--border-subtle` (`#E4E7E9`). Stronger `--border-default` (`#C9CDD0`) for inputs in focus state. Borders separate cards from the page and from each other; they're the primary structural device.

### Cards
- `background: #FFFFFF`
- `border: 1px solid #E4E7E9`
- `border-radius: 12px`
- `padding: 16px`
- `box-shadow: var(--shadow-1)` — soft, just enough to lift off the page
- `margin-bottom: 12–16px`

### Corner radii
- 6 px (sm) — small badges, tags
- 10 px (md) — **default for cards, inputs, buttons** — most common
- 16 px (lg) — large prominent surfaces
- 24 px (xl) — hero / modals
- 9999 (full) — pill buttons, avatars

### Shadows
4-level scale (`--shadow-0/1/2/3`) tuned for light surfaces. Cards use `shadow-1` to lift off the page; popovers, modals, and the role-toggle use `shadow-2`. Hover on interactive cards bumps to `shadow-2`. Avoid heavier shadows — they read as cheap.

### Hover / press states
React Native uses `TouchableOpacity` so the default press state is **opacity dimming** (~0.7). On web mocks, mirror this with `:active { opacity: 0.7 }`. Alternatively, darken surfaces by one neutral step. Never use scale transforms.

### Disabled states
`opacity: 0.4` on the entire control. No additional color shift.

### Animation
Minimal. The native app uses `react-native-reanimated` but only for screen transitions and the `RefreshControl` spinner. No bounce, no springs in UI. **Easing**: ease-out, 150–200ms. Loaders are platform-native `ActivityIndicator` in `--brand-primary`.

### Transparency / blur
**Almost none.** The palette includes `--surface-overlay` at `rgba(15,16,17,0.40)` for modal backdrops, plus `*-bg` variants of semantic colors at ~10 % opacity for alert/badge backgrounds. No blur effects (no backdrop-filter), keeping it cheap on lower-end Android devices.

### Status indicators
Always **dot + text** (color-independence rule). Badges are `8px dot · 6px gap · 11px semibold text`, all in the matching semantic color, on a 14 %-opacity background of the same color, with 6 px radius.

### Alert banners
Full-width row with soft tinted bg, a **3 px left accent rule** in the semantic color, semantic-colored text, right-aligned `→` arrow. Tappable. 5 types: `danger` / `warning` / `brand` / `success` / `info`. Pattern: `<strong>Lead:</strong> body text →`.

### Layout rules
- Screens: 16 px outer padding, vertical scroll, 16 px gap between sections
- Section header: `.lt-label` (uppercase brand-color) + content below
- Stat row: 3 cards in a flex row at top of dashboards, equal width, 12 px gap
- Quick-grid: 3-column wrap on dashboards (33 % each)
- Bottom tab bar: 5 tabs max, icons + label, ~56 px tall

### Imagery
There is essentially no editorial imagery. Avatars are **initial-fill circles** in the brand color (white text on teal). No user uploads displayed except scanned documents (PDF preview).

---

## Iconography

**Primary icon system: emoji as glyphs.** This is unusual but it is what the codebase actually does — see `ClientDashboard.js` quick-grid:

```jsx
{label: 'Справи',  icon: '⚖'},
{label: 'Перевірки', icon: '🔍'},
{label: 'Реєстри', icon: '🗂'},
{label: 'Бюро', icon: '👨‍⚖️'},
{label: 'Чат', icon: '💬'},
{label: 'Документи', icon: '📄'},
```

Plus `📭` for empty states, `→` for chevrons in alert banners, `❌ ⚠️ ✅ ℹ️` as alert prefixes, and `👋` in greetings.

**Secondary**: `react-native-vector-icons@10` is in `package.json` dependencies but is not visibly used in the imported screens. Treat it as available but de-prioritized.

**On the web side (these design previews + UI kit)**: we use **Lucide** via CDN as a 1:1 substitute where emoji feels too playful or where pixel control matters (input glyphs, chevrons, system actions). Stroke-style icons at 1.5 px weight match the brand's calm professionalism.

```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="scale"></i>
```

**🚩 Substitution flag**: emoji rendering varies wildly across platforms (Apple ⚖ vs Google ⚖ vs Twemoji). For the production app this is acceptable because RN renders with the OS emoji font. For the web design previews we keep emoji where the codebase has it, and call out the substitution where Lucide replaces it.

**Logos**: A vector knight-on-horseback mark exists at `assets/logo.png` (recolored to `#2A8FA8`). The wordmark is paired text rendered in Inter 800 in `--brand-primary`. The mark also works inverted on a brand-color surface — see `preview/logo.html` for the full set of lockups (primary lockup, mark-only, header-mark, on-brand surface).

**Backgrounds / illustrations**: None exist in the codebase. The visual identity is intentionally minimal — surfaces, borders, type, and the teal accent do all the work. **Do not invent SVG illustrations** when designing for this brand.

---

## Caveats & substitutions

- ❗ **Mockup PNGs use the V1 gold (#C9A84C) palette** — this design system follows the brand business card (Pantone 7459 C teal) which supersedes both V1 gold and the V2 teal in `tokens.json`. Treat the PNG mockups as layout/structure references only, not color references.
- ❗ **`design/tokens.json` V2 teal (#41A9A5) is close but not canonical.** The brand business card pins primary at Pantone 7459 C ≈ `#2A8FA8` — slightly more muted. `colors_and_type.css` is the source of truth.
- ❗ **No font files shipped.** The native app uses System (SF / Roboto). Web previews use Inter (Google Fonts) as the closest free substitute. No `.ttf`/`.woff2` in `fonts/` because none exist in the source.
- ❗ **Vector icons unused in screens.** `react-native-vector-icons` is installed but the imported screens lean on emoji. Lucide is used as the web substitute where applicable.
