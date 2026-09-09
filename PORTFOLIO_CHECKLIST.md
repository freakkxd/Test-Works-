# Portfolio Demo Checklist — Northstar Demo Suite

> **Важно:** Все данные в демонстрационных версиях синтетические и не относятся к реальным пользователям или организациям. Проекты не являются production-ready и не использовались реальными клиентами.

---

## 1. B2B Marketplace

| Параметр | Значение |
|----------|----------|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api |
| Health | http://localhost:3001/api/health |

### Demo-аккаунты
| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@demo-marketplace.local | admin123 |
| Buyer | buyer@demo-marketplace.local | buyer123 |

### Запуск
```powershell
cd b2b-marketplace
docker compose up --build
```

### Reset / Seed
```powershell
# Через API (нужен admin JWT):
curl -X POST http://localhost:3001/api/admin/demo/reset -H "Authorization: Bearer <token>"

# Или через UI: Админка → «Перегенерировать демо-каталог»
```

### Страницы для скриншотов
1. `/` — каталог с фильтрами (40 товаров, 8 категорий)
2. `/products/:id` — карточка товара с отзывами
3. `/cart` — корзина + banner mock-оплаты
4. `/orders` — мои заказы (10 demo-заказов)
5. `/admin` — админка товаров и заказов

### Порядок демонстрации
1. Открыть каталог → показать фильтры (категория, бренд, цена, наличие)
2. Поиск по SKU (например `DEMO-SKU-1005`)
3. Карточка товара → добавить в корзину
4. Войти как buyer → оформить заказ (mock payment)
5. Войти как admin → показать заказы, reseed кнопку

### Ограничения demo
- Оплата в mock-режиме, реальные списания не выполняются
- Изображения — SVG placeholders
- ЮKassa в test/mock mode

---

## 2. EdTech CRM

| Параметр | Значение |
|----------|----------|
| Frontend | http://localhost:5174 |
| Backend API | http://localhost:8000/api |
| Health | http://localhost:8000/api/health |

### Demo-аккаунты
| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@demo-edtech.local | admin123 |
| Manager | manager@demo-edtech.local | manager123 |
| Teacher | teacher@demo-edtech.local | teacher123 |
| Student | student@demo-edtech.local | student123 |

### Запуск
```powershell
cd edtech-crm
docker compose up --build
```

### Reset / Seed
```powershell
curl -X POST http://localhost:8000/api/demo/seed
```

### Страницы для скриншотов
1. `/dashboard` — метрики (24 студента, группы, оплаты)
2. `/students` — таблица с поиском
3. `/students/:id` — карточка с прогрессом и сертификатом
4. `/schedule` — календарь на 30 дней
5. `/payments` — оплаты + экспорт CSV

### Порядок демонстрации
1. Dashboard → метрики
2. Студенты → поиск → карточка → прогресс → сертификат (100%)
3. Расписание → календарь
4. Оплаты → фильтр → экспорт CSV
5. Переключить роли (manager vs teacher)

---

## 3. Automation Tools

| Параметр | Значение |
|----------|----------|
| Dashboard | http://localhost:8080 |
| API | http://localhost:3002 |
| Health | http://localhost:3002/health |

### Запуск
```powershell
cd automation-tools
docker compose up --build
```

### Reset / Seed
```powershell
# Auto-seed при первом запуске
curl -X POST http://localhost:3002/demo/seed
curl -X POST http://localhost:3002/demo/reset

# Через dashboard UI: кнопки «Загрузить» / «Сбросить»
```

### Webhook-тесты (PowerShell)
```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3002/webhook/order" `
  -ContentType "application/json" `
  -Body '{"orderId":"DEMO-1001","amount":15990,"status":"paid"}'

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3002/webhook/student" `
  -ContentType "application/json" `
  -Body '{"studentId":"DEMO-STUDENT-01","name":"Demo Student","course":"Fullstack Basics"}'

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3002/webhook/payment" `
  -ContentType "application/json" `
  -Body '{"paymentId":"DEMO-PAYMENT-01","amount":24990,"status":"succeeded"}'
```

### Страницы для скриншотов
1. Dashboard — метрики + графики (14 дней)
2. Последние события
3. Кнопки seed/reset

### Порядок демонстрации
1. Открыть dashboard → показать заполненные метрики
2. Графики bar + doughnut
3. Отправить webhook через PowerShell → обновить dashboard
4. Показать mock mode бота (без BOT_TOKEN)

### Ограничения demo
- Telegram bot в mock mode без токена
- Метрики из синтетических событий
- SQLite shared volume

---

## Общий порядок на интервью (15–20 мин)

1. **B2B Marketplace** (7 мин) — самый показательный fullstack
2. **EdTech CRM** (5 мин) — роли, CRM, календарь
3. **Automation Tools** (3 мин) — интеграции, dashboard, webhooks

## Ручные шаги после деплоя

- [ ] Добавить скриншоты в README каждого проекта
- [ ] Задеплоить frontend на Vercel
- [ ] Задеплоить backend на Railway/VPS
- [ ] Для Telegram: получить BOT_TOKEN у @BotFather (опционально)
