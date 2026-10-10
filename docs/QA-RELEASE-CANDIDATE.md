# QA v0.9.0 — candidato no certificado

## Ejecutado en el entorno
- Frontend: 41/41 pruebas Node superadas.
- Backend: 35/35 pruebas Node superadas.
- JavaScript de main.js: verificación de sintaxis Node.
- Integridad del ZIP: verificada tras empaquetado.

## No ejecutado / bloqueado
- Chromium bloquea las navegaciones HTTP y file:// (ERR_BLOCKED_BY_ADMINISTRATOR). Se entrega `tests/browser-smoke.py` para ejecutar en un PC sin esta restricción; **no se considera prueba superada**.
- PostgreSQL/Docker no disponibles. Pruebas E2E, aislamiento real y restauración pendientes.

## Correcciones efectivas
- Etiquetas de versión antiguas en la barra lateral y pie, y guía que indicaba fase 04.
- Batería nueva de navegador con diez rutas en escritorio y móvil, modal y alta de cliente.

## Requisitos para v1.0
1. Ejecutar `backend/verify-real.ps1` con Docker Desktop y PostgreSQL de pruebas y conservar salida.
2. Verificar backup y restauración comparando registros.
3. Ejecutar `python tests/browser-smoke.py` tras levantar el servidor local.
4. Revisar autenticación, separación multiempresa y política de sesiones.
5. Pruebas manuales de formularios críticos en Windows y móvil.

La aplicación no debe procesar datos reales ni emitir facturas legales.
