# Fase 6.7 — Protección de concurrencia y borrado lógico

## Cambios
- `migration_v067.sql` añade `deleted_at` a records. Aplicar con respaldo previo **después** de migraciones 064 y 065.
- `POST /api/records-batch` ahora realiza bajas lógicas con incremento de revisión y exige `expectedRevision`.
- `GET /api/records-all` incluye registros eliminados con `deleted_at` para evitar su reaparición durante sincronizaciones posteriores. Los clientes consumidores deben tratar `deleted_at != null` como eliminación.
- Las rutas antiguas POST/PUT/DELETE `/api/records/:kind[/:id]` devuelven 409 y no escriben, al no tener control de concurrencia.
- Los identificadores borrados no se reutilizan: el alta con `sourceId` repetido devuelve conflicto.

## Restricciones
No se ha verificado conexión con PostgreSQL real, aislamiento real entre dos negocios ni restauración operativa. El frontend sigue siendo local-first y sincronización manual. El endpoint de instantáneas permanece como legado: no usarlo en paralelo con registros por entidad. No utilizar datos de producción.

## Pruebas manuales pendientes
1. Crear negocios A y B, introducir registros y confirmar que A no lee ni altera los de B.
2. Dos sesiones cargan la revisión 1; A actualiza a 2 y B intenta actualizar con 1: debe recibir HTTP 409.
3. Borrado con revisión 2 produce lápida 3; intentar crear con el mismo `sourceId` debe recibir HTTP 409.
4. `pg_dump` / `pg_restore` a base aislada y comparar recuentos y hashes de registros.
5. Validar cada botón y formulario con Playwright en navegador real.
