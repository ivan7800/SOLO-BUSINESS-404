# SOLO BUSINESS 404 · Arquitectura (fase 01)

## Qué es esta entrega
Prototipo web local-first, sin servicios externos, construido con HTML, CSS y módulos JavaScript ES2022. No es un sistema fiscal, no tiene backend ni autenticación. Toda la información de ejemplo es inventada.

## Capas
- `index.html`: punto de entrada compatible con alojamientos estáticos y rutas hash.
- `assets/css/styles.css`: sistema de diseño responsive, temas, accesibilidad y estado visual.
- `assets/js/icons.js`: iconos SVG inline, sin CDN.
- `assets/js/data.js`: fixture de demostración y clave de almacenamiento versionada.
- `assets/js/utils.js`: formato local y codificación segura de texto para HTML.
- `assets/js/store.js`: estado, validación de importaciones, acciones y persistencia local, con prueba unitaria sin navegador.
- `assets/js/views.js`: representaciones de los módulos, métricas y tablas.
- `assets/js/main.js`: router hash, shell, eventos delegados, formularios, modal, búsqueda, backup JSON.

## Decisiones y límites
1. **Sin dependencias remotas:** arranca sin `npm install` y es compatible con GitHub Pages.
2. **Almacenamiento local:** localStorage, sin cifrado, sin copia automática y sin sincronización. No usar para datos de clientes reales. Una exportación JSON contiene los datos sin cifrar.
3. **Módulos sin backend:** CRUD básico y transiciones están simuladas. No se envían correos ni se ejecutan cobros.
4. **Facturación segregada:** IDs `SIM-*`, sin serie fiscal ni emisión. Nada se comunica a la AEAT y los documentos no son facturas reales. Los cálculos de IVA son ilustrativos y no contemplan retenciones, inversión del sujeto pasivo o regímenes especiales.
5. **Seguridad de salida:** todas las cadenas introducidas se codifican al inyectarlas en la interfaz. Las importaciones JSON deben respetar el esquema mínimo; endurecer validación con esquemas completos en fases posteriores.
6. **Arquitectura de destino:** frontend en React/TypeScript (tras validar la UX), API Node/TypeScript, PostgreSQL con aislamiento por organización, colas de procesos y motor fiscal auditado. Esta primera entrega utiliza JS nativo porque la instalación de paquetes no es imprescindible para la demo offline.

## Modelo de datos actual
`meta, clients, quotes, jobs, invoices, expenses, tasks, activity` con versión `1`. Los pagos se simulan mediante el campo `paid` y estado de documentos SIM.

## Próximos criterios técnicos
Autenticación y autorización multi-tenant, validación servidor, logs auditables no editables, cifrado en tránsito y en reposo, backup PostgreSQL probado, pruebas E2E en navegadores, API y control de migraciones. Solo después, análisis e implementación legal de facturación española con comprobación normativa vigente en la fecha de lanzamiento.
