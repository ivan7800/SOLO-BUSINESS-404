# SOLO BUSINESS 404 v0.9.4 — validación reproducible

## Evidencia de este entorno
- `npm test` frontend: **45/45**.
- `npm test` backend: **35/35**.
- Navegación Chromium a `http://127.0.0.1:4173/`: **BLOQUEADA** por `ERR_BLOCKED_BY_ADMINISTRATOR`.
- Navegación Chromium a `file://.../index.html`: **BLOQUEADA** por el mismo control.
- `psql`, `pg_ctl` y `docker`: **no disponibles**. Pruebas PostgreSQL y restauración: **NO EJECUTADAS**.

## Procedimiento Windows
1. Instalar Python y `py -m pip install playwright` y `py -m playwright install chromium`.
2. Ejecutar `VALIDAR_NAVEGADOR_WINDOWS.bat` con datos ficticios.
3. Para PostgreSQL de pruebas: ejecutar `backend/verify-real.ps1` con Docker Desktop, Node.js y Bash.
4. Guardar salida del terminal y comprobar visualmente las operaciones CRUD; la automatización es solo un smoke test parcial.

## Bloqueos de v1.0.0
- Aislamiento multiempresa E2E real.
- Persistencia tras reinicio y restauración comprobada.
- Auditoría interactiva completa y seguridad de despliegue.
- Persistencia remota como fuente principal estable.
- Facturación fiscal deshabilitada hasta validación normativa.
