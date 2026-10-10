# Fase 6.3 — sincronización opt-in (beta)

- Se añade sincronización automática **solo si el usuario la activa explícitamente** tras iniciar sesión.
- Los cambios se agrupan en 1,5 segundos; solo hay una petición de escritura simultánea.
- Cada escritura emplea `expectedRevision` y el servidor responde 409 ante escrituras obsoletas.
- Un conflicto/error deshabilita la sincronización y exige intervención manual.
- No se descarga ni sustituye información local automáticamente; la recuperación manual existente requiere confirmación.
- No hay almacenamiento persistente de tokens; cerrar la pestaña obliga a volver a iniciar sesión.

## Límites pendientes

- Se transmite una copia completa del negocio en cada modificación, no CRUD por entidad.
- Backend sigue limitado a solicitudes JSON de 64 KiB; colecciones grandes pueden superar ese límite.
- No se han probado migraciones sobre un PostgreSQL real en este entorno.
- La aplicación todavía usa localStorage como fuente local; desconectada del servidor puede divergir.
- Esta beta no es apta para datos reales ni para facturación legal.
