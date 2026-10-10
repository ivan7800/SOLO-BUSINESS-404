# Backend de laboratorio · 0.9.7 RC

API Node.js con PostgreSQL, autenticación con token en memoria del navegador, revisiones optimistas, aislamiento por empresa y borrado lógico. No se ejecuta en GitHub Pages. Su interfaz usa `http://127.0.0.1:4174`; utiliza el frontend local para probarla.

## Instalación

Node.js 22, PostgreSQL 16. Desde `backend/`, instala con `npm ci`. Configura DATABASE_URL y APP_ORIGIN a partir de `.env.example`: el proceso lee variables de entorno; no carga automáticamente un archivo .env.

Aplica, por orden, `schema.sql`, `migration_v064.sql`, `migration_v065.sql` y `migration_v067.sql` con `psql -v ON_ERROR_STOP=1 -f ARCHIVO`. Ejecuta `npm start`. Frontend en `http://127.0.0.1:4173`.

## Validación con base desechable

Con Docker activo, ejecuta `bash verify-real.sh` (Windows: `./verify-real.ps1`). Arranca solo el servicio de pruebas de compose, ejecuta pruebas unitarias e integración real y verifica copia/restauración mediante recuentos y hashes de contenido. No apunta a una base de producción. El workflow de GitHub incluye este paso como requisito de publicación.

## Límites actuales

- Laboratorio local, no despliegue de producción. API enlazada a 127.0.0.1, sin TLS ni proxy público.
- Límites de registro/login por IP en memoria; las sesiones requieren PostgreSQL. No hay MFA, auditoría completa ni controles de rol detallados para una operación empresarial.
- Instantáneas limitadas y modos remotos experimentales. Exporta una copia antes de cambiar de modo.
- 35 pruebas unitarias ejecutadas durante esta revisión. Integración PostgreSQL y restauración real no se han ejecutado aquí: faltan PostgreSQL/Docker en el entorno.
- No introducir datos de clientes reales para estas pruebas. No publicar .env, dumps ni exportaciones JSON.

Los documentos SIM no son facturas fiscales. Antes de uso comercial se necesita validar producción, recuperación, seguridad operativa y requisitos legales aplicables.
