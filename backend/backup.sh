#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Define DATABASE_URL}"
command -v pg_dump >/dev/null || { echo 'Falta pg_dump' >&2; exit 1; }
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
name="solobusiness-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --file="$BACKUP_DIR/$name"
chmod 600 "$BACKUP_DIR/$name"
sha256sum "$BACKUP_DIR/$name" > "$BACKUP_DIR/$name.sha256"
echo "Copia creada: $BACKUP_DIR/$name"
