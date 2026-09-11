#!/usr/bin/env bash
# start-all.sh — запуск всех 3 проектов Northstar Demo Suite из коробки
# Использование: ./start-all.sh  |  ./start-all.sh --down  |  ./start-all.sh --logs
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
B2B="$ROOT/b2b-marketplace"
EDTECH="$ROOT/edtech-crm"
AUTO="$ROOT/automation-tools"

# Цвета
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
ok(){ echo -e "${GREEN}✓${NC} $*"; }
warn(){ echo -e "${YELLOW}⚠${NC} $*"; }
fail(){ echo -e "${RED}✗${NC} $*"; }
info(){ echo -e "${CYAN}→${NC} $*"; }

check_docker(){
  if ! command -v docker >/dev/null 2>&1; then fail "docker не найден — установи Docker Desktop https://docs.docker.com/get-docker/"; exit 1; fi
  if ! docker info >/dev/null 2>&1; then fail "docker не запущен — запусти Docker Desktop"; exit 1; fi
  ok "Docker $(docker --version | head -n1)"
}

wait_health(){
  local url=$1 name=$2 tries=30
  info "Жду $name $url ..."
  for i in $(seq 1 $tries); do
    if curl -sf "$url" >/dev/null 2>&1; then ok "$name OK"; return 0; fi
    sleep 2
  done
  warn "$name не ответил за $((tries*2))с — смотри docker compose logs"
  return 1
}

case "${1:-}" in
  --down)
    info "Останавливаю все 3 проекта..."
    (cd "$AUTO" && docker compose down 2>&1 | tail -n 5 || true)
    (cd "$EDTECH" && docker compose down 2>&1 | tail -n 5 || true)
    (cd "$B2B" && docker compose down 2>&1 | tail -n 5 || true)
    ok "Остановлено"
    exit 0
    ;;
  --logs)
    echo "=== B2B ==="; docker compose -f "$B2B/docker-compose.yml" logs --tail=20 2>&1 | tail -n 20
    echo "=== EdTech ==="; docker compose -f "$EDTECH/docker-compose.yml" logs --tail=20 2>&1 | tail -n 20
    echo "=== Automation ==="; docker compose -f "$AUTO/docker-compose.yml" logs --tail=20 2>&1 | tail -n 20
    exit 0
    ;;
  --help|-h)
    echo "Использование: $0 [--down|--logs|--help]"
    echo "  без аргументов — запустить все 3"
    exit 0
    ;;
esac

echo -e "${CYAN}== Northstar Demo Suite — запуск всех 3 проектов ==${NC}"
check_docker

info "1/3 B2B Marketplace (5173/3001) — ~40 сек сборка"
(cd "$B2B" && docker compose up --build -d)
wait_health "http://localhost:3001/api/health" "B2B API" || true
wait_health "http://localhost:5173" "B2B Frontend" || true

info "2/3 EdTech CRM (5174/8000) — ~30 сек"
(cd "$EDTECH" && docker compose up --build -d)
wait_health "http://localhost:8000/api/health" "EdTech API" || true
wait_health "http://localhost:5174" "EdTech Frontend" || true

info "3/3 Automation Tools (8080/3002) — ~20 сек"
(cd "$AUTO" && docker compose up --build -d)
wait_health "http://localhost:3002/health" "Automation API" || true
wait_health "http://localhost:8080" "Automation Dashboard" || true

echo ""
echo -e "${GREEN}== Все 3 запущены ==${NC}"
echo "  B2B Marketplace : http://localhost:5173  (API http://localhost:3001/api/health — 40 товаров)"
echo "  EdTech CRM      : http://localhost:5174  (API http://localhost:8000/api/health — 24 студента)"
echo "  Automation      : http://localhost:8080  (API http://localhost:3002/health — 47 событий)"
echo ""
echo "Demo-аккаунты: B2B admin@demo-marketplace.local/admin123, EdTech admin@demo-edtech.local/admin123"
echo "Логи: $0 --logs  |  Остановить: $0 --down"
echo ""
# Попытка открыть в браузере (Linux/macOS/WSL)
if command -v xdg-open >/dev/null 2>&1; then
  info "Открываю браузер..."
  (xdg-open http://localhost:5173 >/dev/null 2>&1 &); sleep 1
  (xdg-open http://localhost:5174 >/dev/null 2>&1 &); sleep 1
  (xdg-open http://localhost:8080 >/dev/null 2>&1 &)
elif command -v open >/dev/null 2>&1; then
  open http://localhost:5173; open http://localhost:5174; open http://localhost:8080
fi

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "b2b|edtech|automation|NAMES" || true
