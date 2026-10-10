# Revisión v0.9.7 RC — 10 octubre 2026

## Resultado

Lista para subir el código a GitHub. Demo estática preparada para Pages mediante GitHub Actions. El despliegue remoto aún no se ha ejecutado. No se presenta como sistema empresarial certificado.

## Defectos encontrados y corregidos

- **Guardado roto en clientes y presupuestos:** el input `name="id"` oculta `HTMLFormElement.id`. La identificación usa ahora `getAttribute('id')`. La prueba real crea un cliente, crea/envía/acepta un presupuesto y lo convierte en trabajo.
- **Interferencia con formularios remotos:** el manejador global solo cancela formularios propios; deja funcionar el cierre nativo del diálogo remoto.
- **Recuperación inconsistente:** fechas como 30 de febrero y cantidades no numéricas podían aceptarse al crear registros. Se rechazan antes de modificar estado. Se limita el presupuesto de nuevos trabajos al rango que admite la recuperación.
- **Móvil:** las secciones desbordaban a 390 px y Crear nuevo estaba oculto. Se ajusta el contenido flexible y se muestra el acceso a creación.
- **Accesibilidad:** jerarquía de encabezados del dashboard corregida, foco confinado al modal y retorno del foco cuando el elemento sigue presente.
- **Versión:** pie, bienvenida, barra lateral y paquetes alineados en 0.9.7.
- **Publicación:** build de Pages con lista permitida de archivos; no publica backend ni copias. CI con navegador e integración/restauración, deploy condicionado al éxito.
- **Reproducibilidad:** lockfiles de frontend y backend, npm ci y gitignore para secretos, copias, dependencias y resultados temporales.
- **Servidor Windows:** escucha restringida a 127.0.0.1.

## Evidencia ejecutada aquí

- Frontend: 49 pruebas unitarias pasan.
- Backend: 35 pruebas unitarias pasan.
- Chromium real: 34 escenarios pasan (1440 px y 390 px). Diez rutas, ausencia de desbordamiento horizontal, alta de cliente, filtro, recarga/persistencia, presupuesto y conversión a trabajo, gasto, tarea, tema persistente, foco/Escape y exportación JSON. Sin errores JavaScript ni respuestas HTTP >=400 en los recorridos.
- Se ejecuta el navegador contra el resultado de build, bajo `/SOLO-BUSINESS-404/`, para comprobar los recursos relativos y rutas hash.
- Build estático generado correctamente.

Estos 34 escenarios no equivalen a comprobar absolutamente todos los botones o todos los navegadores. La suite Python anterior era insuficiente para certificar el guardado y no se utiliza como evidencia de esta revisión.

## Pendiente y límites

- PostgreSQL y Docker no están disponibles en este entorno. No se ejecutan aquí las pruebas reales de API, concurrencia, aislamiento y restauración. Se incluyen como requisitos del workflow antes de desplegar.
- Windows e iOS físicos, Safari, Firefox y el dominio publicado no se han probado.
- La conexión remota apunta a una API local de laboratorio; no se presenta como nube lista para producción.
- SIM no es factura legal. Las funciones demo no acreditan conformidad fiscal o contable.

## Valoración editorial

Paquete anterior: 7,5/10 para publicación, debido al guardado roto y falta de QA/deploy.
Paquete corregido: **9,0/10 como demo preparada para GitHub Pages**, valoración técnica orientativa basada en el alcance probado.
**No se concede 9,5/10 verificado global:** faltan integración/restauración PostgreSQL y comprobación del despliegue real. El workflow permite cerrar esas comprobaciones con evidencia en lugar de una nota arbitraria.
