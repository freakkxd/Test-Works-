# B2B Marketplace — Northstar Demo v2

> **Подпись:** последние `425adda` `unified` + `0b3ca4d` `package-lock.json` (фикс `npm ci EUSAGE`); в работе `start-all.sh` (один клик `5173`); цель — `40 товаров` `mock-оплата` стабильно из коробки.

Fullstack B2B-маркетплейс для портфолио. Демонстрационная версия с синтетическими данными. **Единый стиль Northstar Design System v2** (`Inter` `slate-50` `#f8fafc` `primary #6366f1` `northstar-header` `◆ Northstar Demo`).

> **Все данные в демонстрационной версии синтетические и не относятся к реальным пользователям или организациям.**

## Функционал

- Каталог с пагинацией (20/стр), фильтрацией по 5+ параметрам, поиском по SKU/названию, сортировкой
- Карточка товара с галереей (SVG placeholders), характеристиками, отзывами
- Корзина, оформление заказа, mock-оплата (ЮKassa test mode)
- Страница «Мои заказы» (10 demo-заказов в разных статусах)
- Админка: CRUD товаров, управление заказами, перегенерация demo-каталога

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, React Query, Zustand |
| Backend | Node.js 20, NestJS, Prisma, PostgreSQL |
| Infra | Docker, PostgreSQL, Redis |

## Запуск

```powershell
cd b2b-marketplace
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001/api
- Health: http://localhost:3001/api/health

## Demo-аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@demo-marketplace.local | admin123 |
| Buyer | buyer@demo-marketplace.local | buyer123 |

## Demo-данные / Reset

При первом запуске автоматически создаётся:
- 8 категорий, 40 товаров, 6 demo-брендов
- 8 покупателей + 1 admin, 12 отзывов, 10 заказов

**Перегенерация через UI:** Админка → «Перегенерировать демо-каталог»

**Через API:**
```powershell
# POST /api/admin/demo/reset (требуется admin JWT)
```

## API Endpoints

```
GET    /api/health
POST   /api/auth/login
GET    /api/products          — каталог (фильтры, пагинация)
GET    /api/products/:id
POST   /api/cart
POST   /api/orders
GET    /api/orders/my
POST   /api/admin/demo/reset  — admin only
```

## Ограничения demo-версии

- Оплата работает в демонстрационном режиме. **Реальные списания не выполняются.**
- Изображения — SVG placeholders (Northstar Demo)
- ЮKassa в test/mock mode
- Не является production-ready продуктом

## Скриншоты

> Добавьте после запуска: каталог, карточка товара, корзина, заказы, админка

## Архитектура

```
frontend/ (React SPA) → nginx → backend:3001/api
backend/  (NestJS modules: auth, products, cart, orders, payments, demo)
prisma/   (PostgreSQL schema + seed)
```
