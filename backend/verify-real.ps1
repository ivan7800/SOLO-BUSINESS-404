$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'BLOQUEADO: Docker no instalado; E2E no ejecutado.' }
docker info *> $null
if ($LASTEXITCODE -ne 0) { throw 'BLOQUEADO: Docker no está arrancado.' }
if (-not $env:SOLO_TEST_PASSWORD) { $env:SOLO_TEST_PASSWORD='solo_local_tests_only' }
$env:DATABASE_URL="postgres://solo_test:$($env:SOLO_TEST_PASSWORD)@127.0.0.1:55432/solo_business_test"
$env:CONFIRM_ISOLATED_TEST_DB='YES'
docker compose up -d --wait postgres
if ($LASTEXITCODE -ne 0) { throw 'No arrancó PostgreSQL' }
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Falló npm install' }
npm test
if ($LASTEXITCODE -ne 0) { throw 'Falló suite unitaria' }
npm run test:e2e
if ($LASTEXITCODE -ne 0) { throw 'Fallaron pruebas PostgreSQL E2E' }
if (Get-Command bash -ErrorAction SilentlyContinue) {
  bash ./test-restore-e2e.sh
  if ($LASTEXITCODE -ne 0) { throw 'Falló prueba de restauración PostgreSQL' }
} else { throw 'La prueba de restauración requiere Git Bash o WSL (bash).' }
Write-Host 'E2E PostgreSQL y restauración SUPERADOS.'
