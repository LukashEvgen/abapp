---
name: lextrack-design
description: Use this skill to generate well-branded interfaces and assets for LexTrack — a Ukrainian-language mobile legal-tracking app for law firms and their clients. Contains design tokens (Palette V2 teal + cool dark), typography, content/tone guidelines, and a click-thru UI kit. Use it for production code, prototypes, slide decks, marketing mocks, or anything else that needs to look on-brand.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files (`colors_and_type.css`, `ui_kits/`, `assets/`, `src/` for original RN source).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc.), copy assets out and create static HTML files for the user to view. Reference `colors_and_type.css` directly — it holds all CSS variables. Pull components from `ui_kits/lextrack_app/` for high-fidelity recreations of the mobile app.

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand. The original React Native source is in `src/` (read-only reference) — it shows how `tokens.json` maps through `theme.js` into screen styles.

Key things to remember:
- **Dark theme only.** Background `#0A0D0E`, brand teal `#41A9A5`.
- **Ukrainian copy**, formal "Ви" address, sentence case, no marketing voice.
- **Emoji as functional iconography** (⚖ 🔍 💬 📄 🗂 👨‍⚖️) — this is intentional, copy it.
- **Flat surfaces**, no gradients, 1 px hairlines, 10 px radius cards.
- **Status badges = dot + text** in matching semantic color, soft 14 % bg.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
