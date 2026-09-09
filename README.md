# Fullstack Portfolio — Northstar Demo Suite

Три fullstack-проекта для портфолио. **Все данные синтетические.**

> Подробный чеклист: [PORTFOLIO_CHECKLIST.md](./PORTFOLIO_CHECKLIST.md)

## Проекты

| # | Проект | URL | Статус |
|---|--------|-----|--------|
| 1 | [B2B Marketplace](./b2b-marketplace/) | http://localhost:5173 | 40 товаров, mock-оплата |
| 2 | [EdTech CRM](./edtech-crm/) | http://localhost:5174 | 24 студента, календарь |
| 3 | [Automation Tools](./automation-tools/) | http://localhost:8080 | Dashboard + webhooks |

## Быстрый старт

```powershell
cd b2b-marketplace && docker compose up --build -d
cd edtech-crm && docker compose up --build -d
cd automation-tools && docker compose up --build -d
```

## Demo-аккаунты

**Marketplace:** admin@demo-marketplace.local / admin123 · buyer@demo-marketplace.local / buyer123

**CRM:** admin@demo-edtech.local / admin123 · manager@demo-edtech.local / manager123

**Automation:** Dashboard без авторизации, auto-seed при запуске

## Ограничения

- Не production-ready
- Не использовались реальными клиентами
- Все email на *.local / example.local
- Оплата в mock-режиме
