# QA v0.9.3 — Restauración reproducible

## Alcance
Se incorporó `backend/test-restore-e2e.sh`, que restaura un `pg_dump` personalizado en la base descartable `solo_business_restore_test`, contrasta conteos y hashes de contenido de las tablas principales y elimina el destino creado. Se niega a trabajar si el destino ya existía.

## Ejecución
Desde `backend`: `./verify-real.sh` en Linux/macOS con Docker Compose; en Windows `./verify-real.ps1` con Docker Desktop, Node.js y Git Bash/WSL para la comprobación de restauración.

## Resultado aquí
Pruebas unitarias ejecutadas; **NO** se ha ejecutado la restauración real porque este entorno no dispone de Docker ni PostgreSQL. No usar datos reales de clientes ni proclamar la release estable.

## Limitaciones
La prueba usa tablas principales y contenidos JSON. No verifica al 100 % permisos, extensiones o tiempos de recuperación. El modo remoto de la aplicación todavía requiere QA interactivo y auditoría de seguridad.
