#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 1 ]]; then echo 'Uso: ./restore.sh fichero.dump' >&2; exit 2; fi
: "${RESTORE_DATABASE_URL:?Define RESTORE_DATABASE_URL de una base VACÍA y AISLADA}"
[[ "${CONFIRM_RESTORE:-}" == 'RESTORE_TO_EMPTY_DATABASE' ]] || { echo 'Requiere CONFIRM_RESTORE=RESTORE_TO_EMPTY_DATABASE' >&2; exit 2; }
for cmd in pg_restore psql sha256sum; do command -v "$cmd" >/dev/null || { echo "Falta $cmd" >&2; exit 1; }; done
[[ -f "$1" && -f "$1.sha256" ]] || { echo 'Se requiere dump y checksum .sha256' >&2; exit 2; }
# Unicamente bases explicitamente identificadas como aisladas de pruebas.
dbname="$(psql "$RESTORE_DATABASE_URL" -Atqc 'SELECT current_database()')"
[[ "$dbname" =~ (^|[_-])(test|testing|e2e)([_-]|$) ]] || { echo 'Destino bloqueado: requiere nombre de base de pruebas (_test/_e2e)' >&2; exit 2; }
# No confiar en la confirmacion manual como prueba de que el destino este vacio.
existing="$(psql "$RESTORE_DATABASE_URL" -Atqc "SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','p','v','m','S','f')")"
[[ "$existing" == '0' ]] || { echo "Destino no vacio: ${existing} objetos; restauracion cancelada" >&2; exit 2; }
(cd "$(dirname "$1")" && sha256sum -c "$(basename "$1").sha256")
pg_restore --dbname="$RESTORE_DATABASE_URL" --no-owner --no-privileges --exit-on-error --single-transaction "$1"
echo 'Restauracion completada sin errores; validar conteos, credenciales y aislamiento.'
