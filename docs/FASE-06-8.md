# Fase 6.8 — guardas de concurrencia

- El envío requiere comparación previa; se cancela si cualquier revisión, alta o borrado remoto cambió desde la comparación.
- Los envíos por entidad se limitan a 100 cambios por transacción. No se fracciona automáticamente: evita confirmar parcialmente una migración de varios lotes.
- Recuperación de registros ignora marcas `deleted_at`, y no permite recrear automáticamente filas eliminadas en el servidor.
- El backend rechaza un `payload.id` distinto del `sourceId` de la operación.

## Limitaciones
No hay PostgreSQL instalado en el entorno utilizado para esta entrega; no se ha probado copia/restauración, HTTPS, dos empresas simultáneas ni el ciclo completo de operaciones de la interfaz. **El frontend sigue siendo local-first y no tiene CRUD conectado directamente a PostgreSQL.** Es una beta, no apta para producción.

## Verificación en equipo con PostgreSQL
1. Ejecutar migraciones hasta `migration_v067.sql` en BD de prueba.
2. Arrancar backend con `DATABASE_URL` y `APP_ORIGIN` locales.
3. Registrar dos negocios distintos; crear un cliente en A y comprobar que B no lo recupera.
4. Comparar desde dos sesiones, actualizar un registro en A y comprobar que la segunda sesión debe volver a comparar.
5. Crear backup, borrar datos de prueba y restaurar en una BD separada; verificar conteos y checksums.
6. Probar manualmente navegación y cada formulario en Chromium y Windows.
