# start-all.ps1 - Start all 3 Northstar Demo Suite projects (Windows PowerShell)
# Usage: .\start-all.ps1  |  .\start-all.ps1 -Down  |  .\start-all.ps1 -Logs
param([switch]$Down, [switch]$Logs, [switch]$Help)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$B2B = Join-Path $Root "b2b-marketplace"
$EdTech = Join-Path $Root "edtech-crm"
$Auto = Join-Path $Root "automation-tools"

function Ok($m){ Write-Host "[OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Fail($m){ Write-Host "[FAIL] $m" -ForegroundColor Red; exit 1 }
function Info($m){ Write-Host "-> $m" -ForegroundColor Cyan }

function Check-Docker {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Fail "docker not found - install Docker Desktop https://docs.docker.com/get-docker/" }
  docker info 2>$null | Out-Null; if ($LASTEXITCODE -ne 0) { Fail "docker not running - start Docker Desktop" }
  Ok "Docker $(docker --version)"
}
function Wait-Health($url, $name, $tries=30){
  Info "Waiting $name $url ..."
  for($i=1; $i -le $tries; $i++){
    try { Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 | Out-Null; Ok "$name OK"; return $true } catch { Start-Sleep 2 }
  }
  Warn "$name not responding after $($tries*2)s"
  return $false
}

if ($Help) { Write-Host "Usage: .\start-all.ps1 [-Down] [-Logs]"; exit 0 }
if ($Down) {
  Info "Stopping all 3..."
  Push-Location $Auto; docker compose down 2>&1 | Select-Object -Last 5; Pop-Location
  Push-Location $EdTech; docker compose down 2>&1 | Select-Object -Last 5; Pop-Location
  Push-Location $B2B; docker compose down 2>&1 | Select-Object -Last 5; Pop-Location
  Ok "Stopped"; exit 0
}
if ($Logs) {
  Write-Host "=== B2B ==="; docker compose -f "$B2B/docker-compose.yml" logs --tail=20
  Write-Host "=== EdTech ==="; docker compose -f "$EdTech/docker-compose.yml" logs --tail=20
  Write-Host "=== Automation ==="; docker compose -f "$Auto/docker-compose.yml" logs --tail=20
  exit 0
}

Write-Host "== Northstar Demo Suite - starting all 3 ==" -ForegroundColor Cyan
Check-Docker

Info "1/3 B2B Marketplace (5173/3001)"
Push-Location $B2B; docker compose up --build -d; Pop-Location
Wait-Health "http://localhost:3001/api/health" "B2B API" | Out-Null
Wait-Health "http://localhost:5173" "B2B Frontend" | Out-Null

Info "2/3 EdTech CRM (5174/8000)"
Push-Location $EdTech; docker compose up --build -d; Pop-Location
Wait-Health "http://localhost:8000/api/health" "EdTech API" | Out-Null
Wait-Health "http://localhost:5174" "EdTech Frontend" | Out-Null

Info "3/3 Automation Tools (8080/3002)"
Push-Location $Auto; docker compose up --build -d; Pop-Location
Wait-Health "http://localhost:3002/health" "Automation API" | Out-Null
Wait-Health "http://localhost:8080" "Automation Dashboard" | Out-Null

Write-Host ""
Write-Host "== All 3 running ==" -ForegroundColor Green
Write-Host "  B2B Marketplace : http://localhost:5173  (API 3001 - 40 products)"
Write-Host "  EdTech CRM      : http://localhost:5174  (API 8000 - 24 students)"
Write-Host "  Automation      : http://localhost:8080  (API 3002 - 47 events)"
Write-Host "Demo accounts: B2B admin@demo-marketplace.local/admin123, EdTech admin@demo-edtech.local/admin123"
Write-Host "Logs: .\start-all.ps1 -Logs  |  Stop: .\start-all.ps1 -Down"
try { Start-Process http://localhost:5173; Start-Sleep 1; Start-Process http://localhost:5174; Start-Sleep 1; Start-Process http://localhost:8080 } catch {}
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String -Pattern "b2b|edtech|automation|NAMES"
