# SOLO BUSINESS 404 · v0.9.7 RC

Aplicación de demostración para organizar clientes, presupuestos, trabajos, costes, tareas y documentos SIM. Interfaz en español, temas claro/oscuro y almacenamiento local en el navegador. Sin dependencias externas en ejecución.

**Preparada para un repositorio GitHub y para publicar la demo estática en Pages.** El backend PostgreSQL se incluye como laboratorio independiente: Pages no lo ejecuta. No emite facturas fiscales ni procesa pagos reales.

## Publicar en GitHub Pages

1. Extrae el ZIP y sube el **contenido** de la carpeta del proyecto a la raíz del repositorio: `index.html`, `assets/`, `package.json`, `.github/`, etc. No subas el ZIP como único archivo.
2. Usa la rama `main`. En **Settings → Pages → Build and deployment → Source**, selecciona **GitHub Actions**.
3. El workflow `.github/workflows/ci.yml` ejecuta pruebas unitarias, navegador de escritorio/móvil, integración PostgreSQL y restauración. Solo publica si todos los trabajos pasan.
4. La web se publica desde `dist/`, generado automáticamente con `npm run build:pages`. Solo contiene HTML y recursos de la aplicación. No publica backend, tests, documentos de QA ni copias.
5. Comprueba la URL que muestra el trabajo `deploy`. Las rutas internas usan `#/…` y los recursos son relativos: funcionan bajo `/NOMBRE-REPOSITORIO/`.

El primer push activa el workflow de validación y publicación. El estado del despliegue se mostrará en Actions cuando termine.

## Uso local

Windows: ejecuta `INICIAR_SOLO_BUSINESS_404.bat` (requiere Python 3). El servidor escucha solo en el equipo local.

Alternativa desde la raíz:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Abre `http://127.0.0.1:4173`. No abras `index.html` mediante `file://`: utiliza un servidor para los módulos JavaScript.

## Cómo empezar

- Crea un cliente y prepara un presupuesto con conceptos, descuentos e IVA orientativo.
- Marca el presupuesto como enviado, luego aceptado; conviértelo en trabajo.
- Registra horas/materiales y controla avance y margen previsto.
- Anota gastos y tareas. Los documentos SIM y cobros son simulaciones.
- En Configuración, exporta JSON antes de borrar datos, cambiar de navegador o usar la conexión remota. Guarda la copia en un lugar privado.

Los registros pertenecen al origen del navegador, no a tu cuenta GitHub. Borrar los datos del sitio o usar otro navegador puede perder o separar tu información. Los datos iniciales son ficticios.

## Pruebas reproducibles

Node.js 22 y Python 3:

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run build:pages
```

Backend: consulta `backend/README.md`. Prueba integrada con Docker: `cd backend` y `bash verify-real.sh` (Windows: `./verify-real.ps1`). Usa exclusivamente la base desechable de pruebas.

## Estado de calidad

La evidencia de esta revisión está en `docs/QA-v0.9.7.md` y en `QA-FRONTEND.txt`, `QA-BACKEND.txt`, `QA-NAVEGADOR.txt`. Los documentos de fases anteriores son históricos; no sustituyen el informe actual. Las capturas existentes pertenecen a entregas anteriores.

Publicable como demo. No certificada como herramienta comercial, contable o fiscal ni como backend de producción.
