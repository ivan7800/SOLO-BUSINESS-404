# SOLO BUSINESS 404 — 0.9.2 RC (no certificada)

## Corrección
Si los datos guardados en el navegador están corruptos o son incompatibles, la aplicación ya no los sobrescribe al realizar cambios. Presenta datos demostrativos temporales con guardado bloqueado y muestra una advertencia.

La copia original permanece en localStorage. `getDamagedOriginal()` permite recuperarla programáticamente antes de escoger una restauración. Las acciones explícitas de restauración o reinicio desbloquean las escrituras.

## QA ejecutado
- 80/80 pruebas unitarias y de regresión (45 frontend, 35 backend).
- No se ejecutaron pruebas reales con PostgreSQL, recuperación de backup, aislamiento multiempresa ni pruebas interactivas completas en Chromium.

## Bloqueos para versión 1.0 comercial
Persistencia PostgreSQL extremo a extremo, recuperación verificada, aislamiento multiempresa, revisión de seguridad y pruebas manuales o automatizadas del UI en un navegador operativo. La aplicación no emite facturas fiscales válidas.
