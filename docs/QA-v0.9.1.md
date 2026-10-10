# SOLO BUSINESS 404 — Informe de QA v0.9.1

## Cambio comprobable
- La app expone un error cuando `localStorage.setItem` falla; muestra alerta durante el uso local.
- La alerta desaparece al recuperarse una escritura posterior.
- No se intenta guardar en `localStorage` cuando se desactiva la persistencia local para modo remoto.

## Pruebas ejecutadas
- Ejecutar `npm test` y `cd backend && npm test` para los resultados actuales.
- Chromium no puede navegar a 127.0.0.1 por `ERR_BLOCKED_BY_ADMINISTRATOR`. No hay prueba visual integral válida.
- Docker y PostgreSQL no están instalados; no se ha ejecutado integración E2E ni restauración.

## Puertas bloqueantes de v1.0.0 comercial
1. CRUD remoto con PostgreSQL real y reinicio de servidor.
2. Aislamiento entre negocios y concurrencia con dos sesiones.
3. Copia y restauración con datos verificados.
4. Navegación real completa de formularios y estados.
5. Revisión de seguridad y requisitos legales para facturación, que sigue deshabilitada.
