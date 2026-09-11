# Fullstack Portfolio — Northstar Demo Suite v2

Три fullstack-проекта в **едином стиле Northstar Design System** (Inter, `slate-50` `#f8fafc`, `primary #6366f1`). **Все данные синтетические.**

> Подробный чеклист: [PORTFOLIO_CHECKLIST.md](./PORTFOLIO_CHECKLIST.md)

![Docker](https://img.shields.io/badge/docker-compose-up-green)
![Node](https://img.shields.io/badge/node-20-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

## Проекты

| # | Проект | URL | Порт | Статус | Технологии |
|---|--------|-----|------|--------|------------|
| 1 | [B2B Marketplace](./b2b-marketplace/) | http://localhost:5173 | 5173→80 / 3001 | 40 товаров, 8 категорий, mock-оплата | React 18 + Vite + NestJS + Prisma + Postgres 16 + Redis 7 |
| 2 | [EdTech CRM](./edtech-crm/) | http://localhost:5174 | 5174→80 / 8000 | 24 студента, календарь, CSV | React 18 + Vite + PHP 8.2 (PDO) + MySQL 8 |
| 3 | [Automation Tools](./automation-tools/) | http://localhost:8080 | 8080→80 / 3002 | Dashboard + 47 событий, webhooks | Fastify + better-sqlite3 + Telegraf + Chart.js |

**Единый стиль v2:** `tailwind.config` `primary #6366f1` `Inter` `northstar-header` `northstar-card` `slate-50` — B2B `Header.tsx` `◆ Northstar Demo`, EdTech `Layout.jsx` `◆`, Automation `index.html` светлый `northstar-topbar` (было `#0f172a`).

## Быстрый старт (из коробки, один клик)

**Linux / macOS / WSL:**
```bash
git clone https://github.com/freakkxd/Test-Works-.git
cd Test-Works-
./start-all.sh              # запустит все 3 последовательно, проверит health, откроет 3 вкладки
# или вручную:
# cd b2b-marketplace && docker compose up --build -d && cd ..
# cd edtech-crm && docker compose up --build -d && cd ..
# cd automation-tools && docker compose up --build -d
```

**Windows PowerShell:**
```powershell
git clone https://github.com/freakkxd/Test-Works-.git
cd Test-Works-
.\start-all.ps1             # то же, для Windows
# Логи: .\start-all.ps1 -Logs
# Остановить: .\start-all.ps1 -Down  /  ./start-all.sh --down
```

Открой в одном окне 3 вкладки: `http://localhost:5173` `http://localhost:5174` `http://localhost:8080`

**Проверка:**
```bash
curl http://localhost:3001/api/health  # {"products":40}
curl http://localhost:8000/api/health  # {"students":24}
curl http://localhost:3002/health      # {"events":47}
docker ps  # 10 контейнеров Up
```

## Что пофикшено для out-of-box (v2)

- **B2B backend** `Dockerfile:18` `COPY src/seed → COPY src` (было `Cannot find module image-search.service` при `prisma db seed`)
- **Automation** `api/Dockerfile:1` `node:20-alpine → node:20-slim` + `apk add python3 make g++` vs `apt-get python3 make g++` (было `fcntl64: symbol not found` `better-sqlite3` на Alpine vs Debian)
- **EdTech frontend** `src/main.jsx:1` добавлен `ReactDOM.createRoot` (было белый экран, только `export default App`)
- **Frontend rollup** `npm ci` с `Node 20.18.0` (было `Cannot find module @rollup/rollup-linux-x64-gnu` из-за `node_modules` из архива)

## Demo-аккаунты

| Проект | Роль | Email | Пароль |
|--------|------|-------|--------|
| **Marketplace** | Admin | admin@demo-marketplace.local | admin123 |
| | Buyer | buyer@demo-marketplace.local | buyer123 |
| **CRM** | Admin | admin@demo-edtech.local | admin123 |
| | Manager | manager@demo-edtech.local | manager123 |
| | Teacher | teacher@demo-edtech.local | teacher123 |
| | Student | student@demo-edtech.local | student123 |
| **Automation** | — | Dashboard без авторизации | auto-seed |

## API Health

- B2B: `http://localhost:3001/api/health` + `http://localhost:3001/api/products?limit=1` (40)
- EdTech: `http://localhost:8000/api/health` + `http://localhost:8000/api/students` (24)
- Automation: `http://localhost:3002/health` + `http://localhost:3002/demo/meta` (47)

## Ограничения

- Не production-ready, не использовались реальными клиентами
- Все email `*.local` / `example.local`, телефоны `+7 900 000-00-00`
- Оплата `mock` (ЮKassa test), изображения `SVG placeholders`
- Волт/данные синтетические, `PORTFOLIO_CHECKLIST.md` — дисклеймер

## Разработка

```bash
# B2B frontend
cd b2b-marketplace/frontend && npm install && npm run dev # :5173

# EdTech frontend
cd edtech-crm/frontend && npm install && npm run dev # :5174

# Automation API
cd automation-tools/api && npm install && node src/index.js # :3002
```

## Версии

- `b2b-marketplace/frontend` Vite 5.4.21, `backend` Nest 10.4 + Prisma 5.22
- `edtech-crm/frontend` Vite 5.4.21, `backend` PHP 8.2 `public/index.php` 362 строки
- `automation-tools/api` Fastify 4.28 + better-sqlite3 11.10 (Node 20)

## Лицензия

MIT
