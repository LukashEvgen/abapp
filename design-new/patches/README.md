# LexTrack — патч для GitHub репо `LukashEvgen/abapp`

Цей пакет оновлює дизайн-шар React Native додатку до **V3 (Light theme · Pantone 7459 C + 444 C)**, відповідно до фірмових кольорів з візитки.

## Зміни

| Файл | Що оновлено |
|---|---|
| `src/utils/theme.js` | Light theme · `primary #2A8FA8`, `secondary #7C8084`, alerts (success #4A9B6E, warning #C28B3C, danger #B84545, info #3D7AA8) |
| `src/components/shared/UIComponents.js` | Виправлено імпорт theme, додано експорт `Logo`, кольори для світлої теми |
| `src/components/shared/Logo.js` | Новий компонент: `<Logo size={32} showText />` |
| `src/screens/shared/LoginScreen.js` | Замінено емодзі `⚖ LexTrack` на `<Logo />`, оновлено кольори |
| `src/assets/logo.png` | Новий PNG-файл, лицар на коні, тил під брендовий теал |
| `design/tokens.json` | Оновлено до v3.0.0 (light theme) |
| `colors_and_type.css` | Web-mirror токенів (для прев'ю) |

## Як застосувати

```bash
# у репо abapp
cp -r patches/src/* src/
cp patches/design/tokens.json design/tokens.json
```

Або вручну скопіюйте ZIP з картки завантаження поверх `src/` та `design/`.

## Важливо

- **`src/utils/theme.js`** залишається source of truth у React Native шарі. Усі StyleSheet'и беруть значення звідси через `colors.*`, `spacing.*`, `typography.*`.
- **`design/tokens.json`** — синхронізується з `theme.js`. Якщо оновлюєте теми в коді — переносьте у JSON.
- `colors_and_type.css` потрібен лише для web-прев'ю в `preview/` та `ui_kits/`.
