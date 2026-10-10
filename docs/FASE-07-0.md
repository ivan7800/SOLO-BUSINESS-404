# SOLO BUSINESS 404 — v0.7.0: consolidación de persistencia (BETA)

## Correcciones comprobables
- `mergeRemoteRecords` descarta registros con `deleted_at` aunque se reciban desde la API. Antes la recuperación manual podía reintroducir registros eliminados.
- Tres nuevas pruebas comprueban borrado lógico, prohibición de resurrección y conservación de activos.
- `GET /api/ready` consulta PostgreSQL con `SELECT 1`; un proceso HTTP funcionando no implica que la base esté disponible.
- El test E2E espera a `/api/ready` y no solo a un proceso abierto.
- `backend/verify-real.ps1` y `backend/verify-real.sh` ejecutan las pruebas con Docker Compose y detienen el procedimiento si falta Docker o fallan pruebas.

## Validación real pendiente
- Docker/PostgreSQL NO estaban disponibles en el entorno de generación; por tanto, E2E real, aislamiento concurrente y restauración NO se consideran superados.
- `localStorage` sigue utilizándose en el modo de demostración; el modo remoto sigue siendo beta.
- La recuperación de un volcado PostgreSQL requiere ensayo aislado adicional y comparación de datos.

## Ejecutar en Windows
1. Instala Node.js 20+ y Docker Desktop. Abre Docker Desktop.
2. PowerShell: `cd backend; .\verify-real.ps1`.
3. Comprueba que `npm run test:e2e` termine correctamente. Si falla, no publiques la aplicación como producción.
4. Conserva logs de CI y prueba aparte backup/restauración en una segunda BD desechable.

No usar datos empresariales reales, emitir facturas legales ni alojar el backend sin TLS, gestión de secretos y auditoría de seguridad.
