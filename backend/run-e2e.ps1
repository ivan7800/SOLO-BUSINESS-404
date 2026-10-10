$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Se necesita Docker Desktop' }
docker compose up -d --wait postgres
if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL no se ha iniciado' }
$password = if ($env:SOLO_TEST_PASSWORD) { $env:SOLO_TEST_PASSWORD } else { 'solo_local_tests_only' }
$env:DATABASE_URL = "postgres://solo_test:$password@127.0.0.1:55432/solo_business_test"
$env:CONFIRM_ISOLATED_TEST_DB = 'YES'
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'npm install falló' }
npm run test:e2e
if ($LASTEXITCODE -ne 0) { throw 'Pruebas de integración fallidas' }
