# Fase 6.4 — migración por entidad (BETA)

- Migración explícita **unidireccional** de las siete colecciones desde un snapshot local validado hacia filas individuales PostgreSQL; copia local intacta.
- Acceso propietario, comprobación de revisión remota, bloqueo por negocio y transacción completa: rollback ante cualquier error.
- Se rechaza la importación cuando ya existen entidades remotas. No se borran registros ni se fusionan cambios.
- `source_id` preserva IDs locales y evita duplicados; `id` mantiene UUID de la API.
- Endpoint de inspección `GET /api/migration-status` con conteos por colección.
- Antes de iniciar el backend en bases existentes aplicar `psql "$DATABASE_URL" -f migration_v064.sql` y hacer backup.
- **Limitaciones**: no hay sincronización bidireccional CRUD ni resolución de conflictos por entidad; el frontend sigue usando localStorage/snapshots. No se ha ejecutado PostgreSQL real ni restauración completa en esta entrega. No utilizar datos reales.
- La API limita peticiones JSON a 64 KiB: migraciones grandes requerirán exportación por lotes con controles adicionales, que aún no están implementados.
