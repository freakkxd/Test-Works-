# Automation Tools — Northstar Demo

Telegram-бот + REST API + Dashboard для автоматизации уведомлений.

> **Все данные в демонстрационной версии синтетические и не относятся к реальным пользователям или организациям. Метрики сформированы из синтетических демонстрационных событий.**

## Функционал

- **Dashboard:** метрики, графики за 14 дней, последние события
- **API:** webhooks для заказов/студентов/платежей, статистика
- **Bot:** /start, /subscribe, /broadcast, /stats (mock mode без токена)
- **Demo seed:** auto-seed при первом запуске, кнопки seed/reset в UI

## Стек

- Node.js 20, Fastify, Telegraf, SQLite, Chart.js

## Запуск

```powershell
cd automation-tools
docker compose up --build
```

- Dashboard: http://localhost:8080
- API: http://localhost:3002
- Health: http://localhost:3002/health

## Demo seed / Reset

```powershell
# Auto-seed при первом запуске (если база пуста)
Invoke-RestMethod -Method Post -Uri "http://localhost:3002/demo/seed"
Invoke-RestMethod -Method Post -Uri "http://localhost:3002/demo/reset"
```

## Webhook-тесты (PowerShell)

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

## Telegram (.env.example)

```env
BOT_TOKEN=
ADMIN_IDS=
API_URL=http://api:3002
DB_PATH=/data/notifications.db
```

При пустом `BOT_TOKEN` бот работает в **mock mode** — приложение не падает.

## Ограничения demo-версии

- Telegram необязателен для dashboard/API
- Метрики из синтетических событий
- Не является production-ready продуктом

## Скриншоты

> Добавьте после запуска: dashboard с метриками, графики, события
