# Fase 6.6 — sincronización manual por entidades (beta)

## Alcance implementado
Se incorpora comparación, envío por lotes (máximo 100 operaciones por lote) y recuperación de entidades mediante `/api/records-all` y `/api/records-batch`. El backend ya aplica filtro por negocio y revisión optimista a este endpoint. La interfaz mantiene el almacenamiento local como edición principal; **no** es todavía CRUD remoto como origen de verdad ni SaaS listo para producción.

## Restricciones de seguridad
- No se infieren eliminaciones remotas: se requiere diseño de tombstones y autorización explícita.
- La comparación se recalcula antes de enviar. Para seguridad real multiusuario hace falta mantener revisión base local; sin ella puede sobrescribir cambios remotos al actualizar un registro existente. **No usar con usuarios concurrentes ni datos reales**.
- Las operaciones se ejecutan por lotes de 100; varios lotes no son una sola transacción. Un fallo puede dejar envío parcial.
- `meta` permanece local, no se sincroniza.
- No se ejecutó PostgreSQL real en este entorno. Aislamiento por negocio, recuperación y backups siguen sin verificarse en integración.

## Pruebas recomendadas antes de producción
1. Levantar PostgreSQL de pruebas y aplicar esquema/migraciones en orden.
2. Crear negocio A y B, guardar datos en A y verificar que B no puede leer/modificar IDs de A.
3. Ejecutar dos sesiones del negocio A: edición concurrente sobre la misma revisión debe producir HTTP 409.
4. Exportar `pg_dump`, destruir base de pruebas, restaurarla con `pg_restore`/`psql` y cotejar conteos y hashes lógicos.
5. Probar todos los botones en navegadores Windows y móvil; reabrir navegador y verificar persistencia.
