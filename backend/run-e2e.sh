#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
command -v docker >/dev/null || { echo 'Docker no instalado' >&2; exit 2; }
docker compose up -d --wait postgres
export DATABASE_URL="postgres://solo_test:${SOLO_TEST_PASSWORD:-solo_local_tests_only}@127.0.0.1:55432/solo_business_test"
export CONFIRM_ISOLATED_TEST_DB=YES
npm install --no-audit --no-fund
npm run test:e2e
