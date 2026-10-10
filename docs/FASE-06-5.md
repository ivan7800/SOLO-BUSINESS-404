# Fase 6.5 — Beta, persistencia por entidad

Implementado: `POST /api/records-batch` con hasta 100 operaciones de alta/actualización/borrado, transacción única, comprobación de revisión, scope `business_id` y permiso owner. `GET /api/records-all` permite inspeccionar registros del negocio. Requiere aplicar `backend/migration_v065.sql` antes de usar los endpoints.

## Límites explícitos

La interfaz todavía usa localStorage como fuente primaria. La API por entidad **no está conectada al frontend**. No se certifica un modo SaaS ni se garantiza recuperación. Sin instancia PostgreSQL no pueden demostrarse aislamiento real, concurrencia ni backup/restore. Los endpoints CRUD antiguos tampoco ofrecen control de revisión: **no deben usarse para escritura de producción**.

## Verificación manual necesaria

1. Levantar PostgreSQL limpio, ejecutar `schema.sql`, `migration_v064.sql`, `migration_v065.sql`.
2. Registrar negocios A y B, obtener tokens separados.
3. Crear un cliente bajo A con revision 0, comprobar lectura con A y ausencia con B.
4. Actualizar bajo A con revision 1, comprobar que revision=2; reintentar revision=1 y exigir 409.
5. Enviar lote con una operación válida y otra conflictiva: comprobar rollback total.
6. Ejecutar `backup.sh`, restaurar en **otra** base vacía mediante `restore.sh`, comparar filas, sesiones y permisos.
7. Probar frontend en Windows/Chromium incluyendo regresión y formularios.
