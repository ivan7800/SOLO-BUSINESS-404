#!/usr/bin/env bash
# SOLO BUSINESS 404 — restore smoke test against the disposable Docker test service.
set -euo pipefail
cd "$(dirname "$0")"
[[ "${CONFIRM_ISOLATED_TEST_DB:-}" == YES ]] || { echo 'BLOQUEADO: requiere CONFIRM_ISOLATED_TEST_DB=YES' >&2; exit 2; }
command -v docker >/dev/null || { echo 'BLOQUEADO: Docker no disponible' >&2; exit 2; }
docker compose ps --status running postgres | grep -q postgres || { echo 'BLOQUEADO: servicio postgres de pruebas no disponible' >&2; exit 2; }
# Both identifiers are fixed test-only names. No user-supplied database identifiers.
SOURCE_DB=solo_business_test
RESTORE_DB=solo_business_restore_test
BACKUP_DIR="$(mktemp -d)"
DUMP="$BACKUP_DIR/test-backup.dump"
CREATED=0
cleanup(){
  if [[ "$CREATED" == 1 ]]; then
    docker compose exec -T postgres psql -U solo_test -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $RESTORE_DB WITH (FORCE)" >/dev/null 2>&1 || true
  fi
  rm -rf "$BACKUP_DIR"
}
trap cleanup EXIT
# Restore destination must not already exist; never drop a preexisting database.
existing="$(docker compose exec -T postgres psql -U solo_test -d postgres -Atqc "SELECT count(*) FROM pg_database WHERE datname='$RESTORE_DB'" | tr -d '
')"
[[ "$existing" == 0 ]] || { echo 'BLOQUEADO: base de restauración ya existe; no se modificará.' >&2; exit 2; }
# Create empty destination and produce a consistent custom-format backup.
docker compose exec -T postgres psql -U solo_test -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $RESTORE_DB" >/dev/null
CREATED=1
docker compose exec -T postgres pg_dump -U solo_test -d "$SOURCE_DB" --format=custom --no-owner > "$DUMP"
[[ -s "$DUMP" ]] || { echo 'ERROR: copia vacía' >&2; exit 1; }
sha256sum "$DUMP" > "$DUMP.sha256"
(cd "$BACKUP_DIR" && sha256sum -c "$(basename "$DUMP").sha256")
# Exit on any SQL error and restore all-or-nothing.
docker compose exec -T postgres pg_restore -U solo_test -d "$RESTORE_DB" --no-owner --no-privileges --exit-on-error --single-transaction < "$DUMP"
for table in businesses users sessions records snapshots; do
  source_count="$(docker compose exec -T postgres psql -U solo_test -d "$SOURCE_DB" -Atqc "SELECT count(*) FROM $table" | tr -d '
')"
  restored_count="$(docker compose exec -T postgres psql -U solo_test -d "$RESTORE_DB" -Atqc "SELECT count(*) FROM $table" | tr -d '
')"
  [[ "$source_count" =~ ^[0-9]+$ && "$restored_count" == "$source_count" ]] || { echo "FAIL $table: $source_count != $restored_count" >&2; exit 1; }
  echo "PASS: $table ($restored_count filas)"
done
# Check content, not just row counts; data changes cannot be concealed by equal counts.
for table in businesses users sessions records snapshots; do
  source_hash="$(docker compose exec -T postgres psql -U solo_test -d "$SOURCE_DB" -Atqc "SELECT md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY md5(to_jsonb(t)::text)),'')) FROM $table t" | tr -d '
')"
  restored_hash="$(docker compose exec -T postgres psql -U solo_test -d "$RESTORE_DB" -Atqc "SELECT md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY md5(to_jsonb(t)::text)),'')) FROM $table t" | tr -d '
')"
  [[ "$source_hash" == "$restored_hash" ]] || { echo "FAIL $table: diferencias de contenido" >&2; exit 1; }
done
echo 'PASS: restauración PostgreSQL de prueba, recuentos e integridad de contenido verificados.'
