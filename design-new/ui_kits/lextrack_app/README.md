# LexTrack Mobile App UI Kit

High-fidelity click-thru recreation of the LexTrack mobile app (React Native 0.73 → ported to web React for design previews).

## Files
- `index.html` — entry. Toggle between Клієнт / Адміністратор role at top.
- `components.jsx` — primitives: `LexButton`, `LexInput`, `LexBadge`, `LexCard`, `LexAlertBanner`, `LexStatCard`, `LexAvatar`, `LexProgressBar`, `LexBottomTabs`, `LexChatBubble`, `LexListRow`, `LexFilterTabs`, `LexLogo`, `LexSectionLabel`, `LexScreenHeader`.
- `screens.jsx` — composed screens: `LoginScreen`, `ClientDashboard`, `MyCases`, `CaseDetail`, `ChatScreen`, `MyInvoices`, `MyDocuments`, `AdminDashboard`, `ClientsList`.
- `ios-frame.jsx` — starter component, iPhone bezel.

## Click-thru flow
**Клієнт**: Login (phone → SMS code) → Dashboard → tap "Справи" tab / "Чат" tab / "Документи" quick-action / case card (opens detail). Bottom tabs: Головна · Справи · Чат · Профіль.

**Адміністратор**: Dashboard → tap chat row (opens chat) / "Клієнти" tab. Bottom tabs: Панель · Клієнти · Чати.

## Source of truth
Visual recreation lifted from the V2 teal palette in `/design/tokens.json` plus the screen layouts in `/src/screens/`. Mockup PNGs in `/mockups/` use the legacy V1 gold palette and were used only for layout/structural reference.
