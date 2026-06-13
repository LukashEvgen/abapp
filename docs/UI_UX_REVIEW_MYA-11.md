# UI/UX Ревю LexTrack — MYA-11

**Виконав:** UI/UX Designer (Agent)  
**Дата:** 2026-06-13  
**Версія:** LexTrack Design System V3 (tokens.json v3.0.0)  

---

## 1. Загальний вердикт

Дизайн-система (tokens + theme.js) формально структурована і покрита тестами. Однак існує **критична розбіжність між canonical мокапами (design/mockups/) і реалізованим кодом**: мокапи показують **темну тему з золотими акцентами**, тоді як код реалізує **світлу тему з бірюзовими акцентами** (Pantone 7459 C teal). Це порушує принцип «єдиного джерела правди» і створює ризик фрагментації UI.

**Рекомендація:** інтегрувати повноцінну підтримку dark mode, щоб задовольнити обидві вимоги — мокапи (темна) і tokens (світла).

---

## 2. Детальний аудит за напрямками

### 2.1 Кольорова палітра та теми (CRITICAL)

| Параметр | Статус | Примітки |
|----------|--------|----------|
| Tokens.json (V3 Light) | OK | Коректна 11-ступенева neutral, semantic з Bg-варіантами |
| colors_and_type.css | OK | Відповідає tokens, але тільки для web preview |
| theme.js → `colors.gold` | **BUG** | `colors.gold = tokens.colors.brand.primary` = `#2A8FA8` (бірюзовий!). Мокапи очікують золотий/amber акцент. |
| theme.js → `colors.inputBg` | **BUG** | Використовується в `globalStyles.input`, але не існує в colors — буде `undefined`. |
| Мокапи vs Code | **CRITICAL MISMATCH** | Мокапи: темний фон `#1B1D1F`, золоті акценти. Код: `bg = #FFFFFF`, `gold = #2A8FA8`. |
| Dark mode | MISSING | Немає dark tokens, Appearance API, toggle. Мокапи не можна реалізувати без dark mode. |
| Accessibility — contrast | ⚠️ | `#2A8FA8` на `#FFFFFF` = 3.2:1 — **не проходить WCAG AA для small text** (потрібно 4.5:1). Primary brand колір занадто світлий для світлої теми. |

**Рекомендації:**
1. Додати `design/tokens-dark.json` з інверсованими surface/text кольорами.
2. Виправити `colors.gold` — або додати окремий amber/gold token в tokens.json, або відокремити brand primary від accent gold.
3. Виправити `colors.inputBg` — використовувати `colors.surfaceSemantic.sunken` або `colors.neutral['100']`.
4. Перевірити контраст `brand.primary` на `surface.bg` — якщо < 4.5:1, потрібно темніший відтінок для interactive елементів.

---

### 2.2 Типографіка (OK з нюансами)

| Параметр | Статус | Примітки |
|----------|--------|----------|
| Scale (11/12/14/16/18/22/28/34) | OK | Chunking ≥ 2 px — чітка ієрархія |
| Line-height | OK | Збалансовані tight/snug/normal/relaxed |
| Letter-spacing | OK | wide/wider для заголовків і labels |
| Font family | ⚠️ | tokens.json: `"System"`, CSS: `Inter + JetBrains Mono`. На iOS це San Francisco, на Android — Roboto. Різниця помітна. Рекомендовано підключити Inter як custom font у RN. |
| Label style (typography.label) | OK | uppercase + wider tracking — добре для scanability |

---

### 2.3 Компоненти (src/components/shared/) (NEEDS EXPANSION)

| Компонент | Статус | Проблеми |
|-----------|--------|----------|
| `Badge` | OK | Добре: dot + text combo, `statusColors` + `statusBgColors` мапінг |
| `GoldButton` | OK | Підтримує filled/ghost, small/normal, disabled, loading. Але назва «Gold» — місконцепція (колір бірюзовий). |
| `Card` | OK | Простий, з border + radius, flatShadow(1). |
| `SectionLabel` | OK | Використовує `typography.label`. |
| `Input` | ⚠️ | Немає `label` prop — тільки placeholder. A11y: screen reader не бачить назви поля. Немає error/helper text. Немає focus ring (border-focus з tokens.css). |
| `AlertBanner` | OK | 4 типи (danger/warning/success/gold). Тип «gold» використовує `brand.primaryMuted` — ок. |
| `StatCard` | OK | Простий, emoji іконки. |
| `Avatar` | OK | Initials-based, scalable size. |
| `ProgressBar` | OK | Загальний, але немає percentage label всередині бару. |
| `LoadingScreen` | OK | Простий ActivityIndicator. |
| `EmptyState` | OK | Emoji + title + subtitle. |

**Відсутні компоненти (є в мокапах, немає в коді):**
- `BottomNavigation` — 5-tab (Головна/Справи/Перевірки/Реєстри/Бюро)
- `ChatBubble` — inbound/outbound з avatar + timestamp
- `TimelineConnector` — вертикальна лінія з dots для CaseDetail
- `SearchBar` — з icon + clear button
- `Header` — з back button + title + actions
- `BottomSheet` / `Modal` — для filters, selectors

---

### 2.4 Mockups vs ТЗ відповідність (CRITICAL)

Перевірено 18 мокапів у `design/mockups/`:

| Екран | Є в коді? | Відповідає мокапу? | Проблеми |
|-------|-----------|---------------------|----------|
| `login.png` | `LoginScreen.js` | ❌ Тема не збігається | Мокап: темний фон + золотий логотип. Код: світлий фон + бірюзовий логотип (⚖ LexTrack). |
| `dashboard.png` | `ClientDashboard.js` | ❌ Тема не збігається | Мокап: темний фон, золоті labels, статуси. Код: світлий фон, бірюзові labels. Іконки в «Швидкий доступ» в мокапі — дуже темні, майже невидимі на картках (контрастна проблема в самому мокапі!). |
| `case_detail.png` | `CaseDetail.js` | ❌ Тема не збігається | Мокап: темний фон, золоті дати. Код: світлий фон, бірюзові дати. Таймлайн без connector лінії (в мокапі є візуальна лінія/structural розділення). |
| `my_cases.png` | `MyCases.js` | ⚠️ Не перевірено | — |
| `clients_list.png` | `ClientsList.js` | ⚠️ Не перевірено | — |
| `chat.png` | `ChatScreen.js` | ⚠️ Не перевірено | — |
| `scanner.png` | `ScannerScreen.js` | ⚠️ Не перевірено | — |
| `registry_search.png` | `RegistrySearch.js` | ⚠️ Не перевірено | — |
| `create_invoice.png` | `CreateInvoice.js` | ⚠️ Не перевірено | — |
| `admin_dashboard.png` | `AdminDashboard.js` | ⚠️ Не перевірено | — |
| `admin_case_detail.png` | `AdminCaseDetail.js` | ⚠️ Не перевірено | — |
| `admin_chat.png` | `AdminChat.js` | ⚠️ Не перевірено | — |

**Примітка:** Найбільша проблема не в layout чи структурі (вони загально подібні), а в **кольоровій схемі**. Мокапи були створені як canonical dark theme, а код реалізує світлу тему — це фундаментальний зсув.

---

### 2.5 Responsive та Layout

| Параметр | Статус | Примітки |
|----------|--------|----------|
| Spacing unit = 4 px | OK | Консистентна шкала |
| quickGrid (ClientDashboard) | ⚠️ | `width: '30%'` — hardcoded 3-col. На планшеті залишатиме пустий простір, на дуже маленькому екрані може перекриватися. Рекомендовано: `flex: 1` з `minWidth` або `gap` grid. |
| ScrollView padding | OK | `contentContainerStyle={{padding: spacing.md}}` — стандартно. |
| KeyboardAvoidingView (Login) | OK | `behavior="padding"` для iOS. |
| SafeArea | ⚠️ | Не перевірено в явному вигляді — `globalStyles.container` має `flex: 1` але не використовує SafeAreaView. На iPhone з notch вміст може заходити під status bar. |

---

### 2.6 Accessibility

| Параметр | Статус | Примітки |
|----------|--------|----------|
| WCAG AA contrast (text/bg) | ⚠️ | `text.primary` (#1B1D1F) на `bg` (#FFFFFF) = ~16:1 — OK. Але `brand.primary` (#2A8FA8) на білому = 3.2:1 — **FAIL для small text / interactive**. |
| Color-only indicators | ⚠️ | `Badge` використовує dot + text — OK. Але `ProgressBar` — тільки колір, без percentage text всередині. |
| Emoji як icons | ❌ | ClientDashboard quickGrid використовує emoji (⚖ 🔍 💰). Screen readers читають їх як «scales», «magnifying glass» — не критично, але непрофесійно. Рекомендовано SVG/vector icons (напр. react-native-svg / lucide-react-native). |
| Input labels | ❌ | `Input` компонент не приймає `label`. Placeholder зникає при вводі. Screen reader користувач не знає, що це за поле, якщо placeholder був єдиною підказкою. |
| Touch targets | OK | Кнопки, картки, банери — достатнього розміру (≥ 44×44 pt). |
| Focus indicators | ❌ | Немає видимих focus rings у `globalStyles`. CSS tokens мають `--shadow-focus`, але він не перенесений у RN. |
| Dark mode (a11y) | MISSING | Деякі користувачі потребують dark mode через фоточутливість. Відсутність — серйозний accessibility gap. |

---

## 3. Рекомендації (пріоритезовані)

### 🔴 Critical (блокують реліз)

1. **Вирішити темну/світлу розбіжність**
   - Варіант A: Реалізувати **dark mode** (Appearance API + `tokens-dark.json`) — мокапи стануть реалістичними.
   - Варіант B: Оновити **мокапи до світлої теми** (Pantone teal/grey) — менше роботи, але втрачається «золотий» premium look.
   - **Рекомендовано Варіант A** — premium legal-додаток виглядає дорожче в темній темі.

2. **Виправити `colors.gold` місконцепцію**
   - Додати в tokens.json `brand.accent` або `brand.gold` з amber/gold значенням.
   - Або перейменувати `colors.gold` → `colors.accent` і залишити teal як primary.

3. **Виправити `colors.inputBg` undefined**
   - Замінити в `globalStyles.input` на `colors.surfaceSemantic.sunken` або `colors.neutral['100']`.

### 🟡 High (покращують якість)

4. **Додати компоненти, що відсутні в мокапах:**
   - `BottomNavigation`
   - `ChatBubble`
   - `TimelineConnector` (для CaseDetail)
   - `SearchBar`
   - `ScreenHeader`

5. **Поліпшити accessibility:**
   - Додати `label` prop до `Input` (accessibilityLabel + visual label).
   - Додати `accessibilityRole` та `accessibilityHint` до `GoldButton`, `Card`, `AlertBanner`.
   - Додати focus ring / outline для interactive елементів.
   - Замінити emoji іконки на SVG (lucide-react-native).

6. **Покращити responsive:**
   - `quickGrid` → `flex: 1` з `gap` замість `width: '30%'`.
   - Додати `SafeAreaView` до root containers.

### 🟢 Medium (polish)

7. **Підключити Inter font** в React Native (react-native-vector-fonts або expo-font).
8. **Додати `tokens.json` валідацію в CI** (style-dictionary або custom JSON Schema).
9. **Додати percentage label до `ProgressBar`** для color-independence.
10. **Перевірити констраст мокапів** (особливо dark icons на dark cards в dashboard).

---

## 4. Позитивні знахідки

- ✅ **Tokens.json** — чітка структура, semantic + neutral + brand, з opacity-Bg для alerts.
- ✅ **theme.test.js** — добре покриття regression тестами (legacy flat keys, nested palettes, spacing, typography).
- ✅ **PaletteV2RegressionScreen** — чудовий інструмент для візуального QA і snapshot testing.
- ✅ **UIComponents.js** — компактний, але зрозумілий дизайн: консистентні border/radius/shadow, добре використання `spacing` і `radius` токенів.
- ✅ **Helpers** (`formatDate`, `formatCurrency`, `statusColors`) — правильна локалізація (uk-UA), розумний status mapping.

---

## 5. Заключення

LexTrack Design System V3 має **солідну фундацію** у вигляді tokens і тестів. Але між дизайном (мокапи) і кодом існує **стінова розбіжність у кольоровій схемі**. Перш ніж рухатися далі з новими екранами, **необхідно вирішити, яка тема є canonical**: темна (мокапи) чи світла (tokens). Після цього залишки рекомендацій (компоненти, accessibility, responsive) можна впроваджувати ітеративно.
