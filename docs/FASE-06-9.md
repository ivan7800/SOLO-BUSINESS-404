# Fase 6.9 — Modo servidor experimental

La interfaz mantiene `localStorage` y puede activar **modo servidor** tras iniciar sesión y hacer una migración explícita. Para evitar pérdidas, el modo exige que las entidades locales y remotas sean idénticas; no mezcla conjuntos divergentes. Un cambio local provoca una transacción por lote (máximo 100 operaciones) protegida con revisiones y comprobación de línea base. Ante una discrepancia de revisiones, desconexión o borrado local no compatible, la escritura se detiene. El cliente conserva los cambios locales pendientes; no se autorresuelven conflictos.

## Límites críticos

- No es persistencia exclusivamente PostgreSQL: se escribe en local primero.
- Las eliminaciones no están conectadas al servidor y provocan detención preventiva.
- Si se cierra el navegador antes de terminar una petición, el envío puede quedar pendiente.
- Dos pestañas del mismo navegador no tienen bloqueo mutuo; no usar como SaaS.
- Falta validar contra PostgreSQL real, aislamiento de negocios, pruebas HTTP integrales, copia/restauración y QA de botones.
- No admite facturación fiscal ni datos reales.

## Verificación manual recomendada

1. Crear dos cuentas/negocios y aplicar las migraciones SQL hasta v067.
2. Migrar los datos locales y contrastar `/api/records-all` con el JSON exportado.
3. Activar modo servidor, añadir un cliente y esperar confirmación.
4. Abrir segunda sesión, comprobar que el cliente persiste tras reiniciar el servidor.
5. Cambiar el mismo registro desde dos sesiones: confirmar HTTP 409 y bloqueo del modo.
6. Confirmar que dos negocios no pueden acceder a registros ajenos.
7. Ejecutar `backup.sh`, restaurar en una base vacía aislada y comparar los datos.

Hasta completar estas pruebas la fase se considera **beta**, no definitiva.
