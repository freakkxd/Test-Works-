# EdTech CRM — Northstar Demo v2

> **Подпись:** последние `425adda` `unified` + `e5109ea` `start-all.sh`; в работе `5174` `24 студента` `calendar` из коробки; цель — `4 роли` `CSV` без белого экрана (`main.jsx` `createRoot`).

CRM для учебного центра с ролями, расписанием, оплатами и прогрессом обучения. **Единый стиль Northstar Design System v2** (`Inter` `primary #6366f1` `northstar-header` `◆ Northstar Demo`, фикс белого экрана `main.jsx` `ReactDOM.createRoot`).

> **Все данные в демонстрационной версии синтетические и не относятся к реальным пользователям или организациям.**

## Функционал

- **Дашборд:** студенты, группы, оплаты, задолженность, ближайшие занятия
- **Студенты:** 24 записи, поиск, фильтры, карточка с прогрессом и сертификатом
- **Расписание:** календарь на 30 дней, создание занятий
- **Оплаты:** paid/pending/overdue, экспорт CSV (UTF-8 BOM)
- **Роли:** admin, manager, teacher, student

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | React 18, JavaScript, Tailwind CSS |
| Backend | PHP 8.2 API (Laravel-style architecture), MySQL |
| Infra | Docker, MySQL 8 |

## Запуск

```powershell
cd edtech-crm
docker compose up --build
```

- Frontend: http://localhost:5174
- Backend: http://localhost:8000/api
- Health: http://localhost:8000/api/health

## Demo-аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@demo-edtech.local | admin123 |
| Manager | manager@demo-edtech.local | manager123 |
| Teacher | teacher@demo-edtech.local | teacher123 |
| Student | student@demo-edtech.local | student123 |

## Demo-данные / Reset

Автоматически при первом запуске: 24 студента, 4 курса, 8 групп, ~15 занятий, платежи, прогресс, сертификаты.

```powershell
curl -X POST http://localhost:8000/api/demo/seed
```

## API Endpoints

```
GET  /api/health
POST /api/login
GET  /api/dashboard
GET  /api/students
GET  /api/students/:id/progress
GET  /api/students/:id/certificate
GET  /api/schedules
GET  /api/payments
GET  /api/payments/export/csv
POST /api/demo/seed
```

## Ограничения demo-версии

- Email только на домене example.local
- Телефоны фиктивные (+7 900 XXX-XX-XX)
- Не является production-ready продуктом

## Скриншоты

> Добавьте после запуска: дашборд, студенты, карточка, расписание, оплаты
