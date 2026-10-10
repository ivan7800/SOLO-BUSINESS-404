# SOLO BUSINESS 404 v0.9.5 — QA reproducible

Esta entrega **no certifica** PostgreSQL ni pruebas de navegador: documenta evidencia y mejora el comprobador.

## Cambios
- `tests/browser-smoke.py` inicia un servidor HTTP de pruebas en un puerto libre (salvo que se defina `SOLO_BASE_URL`).
- El servidor se detiene al salir incluso ante fallos; ya no queda un proceso Python iniciado por un BAT separado.
- Si pasan las pruebas, se genera `QA-NAVEGADOR.json`.
- Para probar con Chromium instalado en el sistema: `SOLO_CHROMIUM_PATH` permite indicar el ejecutable.

## Bloqueos de este entorno
- Chromium real inicia pero devuelve `net::ERR_BLOCKED_BY_ADMINISTRATOR` para localhost. Navegación interactiva **no verificada**.
- PostgreSQL y Docker no disponibles. E2E y restauración **no ejecutados**.
- La facturación fiscal continúa siendo una simulación y no debe usarse comercialmente.

## Validar en Windows
1. Instalar `py -m pip install playwright` y `py -m playwright install chromium`.
2. Ejecutar `VALIDAR_NAVEGADOR_WINDOWS.bat`.
3. Comprobar el resultado `QA-NAVEGADOR.json`.
4. Con Docker Desktop, ejecutar `backend/verify-real.ps1` sobre bases de pruebas.
