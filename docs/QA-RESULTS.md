# SOLO BUSINESS 404 · QA de fase 01
**Fecha:** 10/10/2026 · **Versión:** v0.1.0

## Pruebas automatizadas
- `node --test tests/*.test.mjs`: **8/8** superadas, sin dependencias de npm.
- Chromium headless: **13 recorridos funcionales**, sin excepciones JavaScript observadas en el entorno de prueba.
- Controles extra probados: menú Crear nuevo (6 accesos), centro de actividad, botón cambiar tema, guía, **exportar JSON** (descarga comprobada), **importar JSON** (datos importados comprobados).
- Vista móvil 390 × 844 px: sin desbordamiento horizontal, menú lateral y navegación correctos.

## Matriz resumida
| Área | Qué se comprobó | Resultado |
|---|---|---|
| Inicio | Renderizado y diez entradas de navegación | OK |
| Clientes | Alta y persistencia durante sesión | OK |
| Presupuestos | Alta, enviado, aceptado, crear trabajo | OK |
| Trabajos | Alta, iniciar, completar | OK |
| Documentos SIM | Alta; aviso no fiscal visible | OK |
| Gastos | Alta y filtrado | OK |
| Cobros | Registro parcial simulado | OK |
| Agenda | Alta y completar tarea | OK |
| Buscador | Ctrl+K, búsqueda y Esc | OK |
| Ajustes | Tema claro/oscuro, color de acento y nombre de negocio | OK |
| Datos | Exportación, importación y restauración con confirmación | OK |
| Diseño | Desktop 1440 y móvil 390; menú móvil | OK |

## Condiciones de la prueba de navegador
El Chromium proporcionado en el entorno de desarrollo tiene una política global `URLBlocklist: ["*"]`, que bloquea incluso `localhost` para navegación automatizada. Para comprobar eventos, flujos e interfaz se cargaron **exactamente los archivos CSS y JS de la entrega en un documento en memoria**, con importaciones ES transformadas en concatenación de módulos y un `localStorage` simulado. Esto no es equivalente a una prueba end-to-end completa con servidor real, por lo que la carga de módulos y arranque por HTTP en un Chrome Windows normal, así como el archivo `.bat`, quedan pendientes de validación en un equipo Windows real.

El servidor HTTP local **sí respondió 200** a `/` mediante `curl`. Se validaron los ficheros JS con `node --check` y se ejecutaron pruebas unitarias sobre los módulos ES reales.

## Pendientes antes de producción
- Prueba de integración final desde URL HTTP servida en Chrome/Edge de Windows.
- Prueba de instalación y lanzamiento por el BAT de Windows.
- Accesibilidad auditada (teclado completo, lectores de pantalla y contraste).
- No existe backend, base de datos central, multiusuario ni seguridad empresarial.
- No existe emisión de facturas ni validación de cumplimiento fiscal español.
