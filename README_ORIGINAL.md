# Gestión y Dirección de Proyectos · GEP

Web independiente para los seis primeros capítulos del libro escaneado de Gestión de Empresas y Proyectos. Incluye 165 tarjetas, 23 casos, 6 mapas y 36 preguntas de práctica con referencias de página. La guía de la web explica las fuentes revisadas y discrepancias detectadas.

Abre `web/dist/index.html` en el navegador. Funciona sin conexión. `GEP-temas-1-6.zip` contiene únicamente los archivos de la web; extráelo antes de abrir index.html. No se ha publicado en Internet ni incluye documentos originales o datos de progreso.

El progreso se guarda en este navegador con clave `gestion-proyectos-progreso-v1`, independiente de Aleaciones. Usa exportación/importación para conservarlo. Los tests no forman parte del progreso persistido.

Contenido editable: `web/temas/t1.json` a `t6.json`. Tras editar los JSON, desde la carpeta WEB ejecuta:

```powershell
node gestion-proyectos/web/compilar-contenido.cjs
node gestion-proyectos/web/validar-contenido.cjs
node gestion-proyectos/web/pruebas-progreso.cjs
node gestion-proyectos/web/pruebas-interfaz.cjs
```

`crear-contenido.cjs` conserva la preparación editorial original; ejecutarlo sobrescribe los JSON. `web/fuentes.json` inventaría los documentos y su número de páginas. `materiales/` conserva los originales. `tmp/` contiene páginas renderizadas y texto auxiliar de lectura y no se distribuye.
