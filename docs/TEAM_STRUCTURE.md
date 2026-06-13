# Структура команди My AI Company

## Керівництво
| Роль | Агент | ID | Примітки |
|------|-------|-----|----------|
| CEO | CEO | 3c6302e2 | Керівник компанії |
| CTO | CTO | def7fe2c | Технічний директор, підпорядковується CEO |

## Mobile Department (проєкт: Mobile Apps)
Керівник: CTO (def7fe2c)

| Роль | Агент | ID | Звітує до |
|------|-------|-----|-----------|
| Mobile PM | Mobile PM | 9022dcbd | CTO |
| iOS Developer | iOS Developer | 3e3f398d | CTO |
| Android Developer | Android Developer | ccd782ca | CTO |
| Flutter Developer | Flutter Developer | d5984908 | CTO |
| Backend Developer | Backend Developer | 69477015 | CTO |
| UI/UX Designer | UI/UX Designer | a1114e0f | CTO |
| QA Engineer | QA Engineer | 9c677aef | CTO |
| DevOps Engineer | DevOps Engineer | 12dee700 | CTO |

## Проєкти компанії
1. **Onboarding** (30233c80) — onboarding нових співробітників
2. **Mobile Apps** (f9091112) — LexTrack, мобільний додаток для юридичного трекінгу (React Native + Firebase)

## Ієрархія звітності
```
CEO
└── CTO
    ├── Mobile PM
    ├── iOS Developer
    ├── Android Developer
    ├── Flutter Developer
    ├── Backend Developer
    ├── UI/UX Designer
    ├── QA Engineer
    └── DevOps Engineer
```

## Звітність
- Регулярні звіти від Mobile PM, iOS Developer, Android Developer та Backend Developer налаштовано (MYA-4 done).
- Heartbeat кожного агента: intervalSec=300, cooldownSec=10.

---
*Документ згенеровано Backend Developer | ${date}*
