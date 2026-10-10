#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v docker >/dev/null 2>&1; then echo 'BLOQUEADO: falta Docker. Prueba PostgreSQL NO ejecutada.' >&2; exit 2; fi
if ! docker info >/dev/null 2>&1; then echo 'BLOQUEADO: Docker no está arrancado.' >&2; exit 2; fi
export SOLO_TEST_PASSWORD="${SOLO_TEST_PASSWORD:-solo_local_tests_only}"
export DATABASE_URL="postgres://solo_test:${SOLO_TEST_PASSWORD}@127.0.0.1:55432/solo_business_test"
export CONFIRM_ISOLATED_TEST_DB=YES
if ! docker compose up -d --wait postgres; then echo 'ERROR: PostgreSQL no arrancó.' >&2; exit 1; fi
npm ci --no-audit --no-fund
npm test
npm run test:e2e
bash test-restore-e2e.sh
printf '\nVALIDACIÓN: integración y restauración en PostgreSQL de pruebas superadas.\n'
