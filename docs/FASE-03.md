# FASE 03 · Presupuestos profesionales (demo)

Implementado: creación y edición de borradores, hasta 40 líneas, cantidad, precio, descuento por línea, IVA por línea (0/4/10/21), cálculo de base/IVA/total, observaciones y validez, impresión y PDF vía navegador, estados Borrador → Enviado → Aceptado/Rechazado, creación única de trabajo vinculado a presupuesto aceptado. Las operaciones son locales y los estados manuales.

## QA
- `npm test`: 15 pruebas superadas (incluidas 3 de presupuestos).
- `node --check assets/js/*.js`: sin errores sintácticos.
- Interfaz gráfica en Windows / navegador real: pendiente de validar; no se certifican aquí todos los botones.

## Limitaciones
- `localStorage` sin backend ni copia remota, no apto para producción.
- El PDF se obtiene con Imprimir > Guardar como PDF, no se descarga directamente.
- IVA orientativo; sin IRPF, recargo de equivalencia, regímenes especiales ni cumplimiento fiscal.
- Marcar enviado o aceptado no significa que se haya enviado ni aceptado jurídicamente.
- Datos anteriores admitidos en importación. Se conservan en el mismo almacenamiento y se usan líneas virtuales en presupuestos antiguos.
