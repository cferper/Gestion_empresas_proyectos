# Gestión de Empresas y Proyectos

Web de estudio estática en HTML, CSS y JavaScript. Seis temas con 165 tarjetas, 23 casos, 6 mapas y 36 preguntas de test. Copia independiente con el contenido, diseño y funcionamiento originales. No utiliza React ni necesita instalar paquetes.

## Abrir desde Visual Studio Code

1. Selecciona **Archivo → Abrir carpeta** y abre esta carpeta de proyecto.
2. Abre `web/dist/index.html` en tu navegador mediante el explorador del sistema. Funciona sin conexión y sin instalar dependencias.
3. Para una dirección HTTP estable, abre la terminal de VS Code en la raíz de este proyecto y, si tienes Python instalado, ejecuta:

```powershell
py -m http.server 8011 --bind 127.0.0.1 --directory web/dist
```

Abre `http://127.0.0.1:8011/`. Si usas un sistema sin el lanzador `py`, sustituye `py` por `python` o `python3` según tu instalación. Mantén la terminal abierta; Ctrl+C detiene el servidor. Este comando sirve sólo la web, no sus PDF.

El progreso se guarda en el navegador. Exporta una copia antes de cambiar de dirección o de navegador e impórtala después. El traslado no copia automáticamente localStorage. Las claves de progreso de las dos asignaturas se mantienen intactas y separadas.

## Contenido y comprobaciones

`web/dist/` contiene los seis archivos necesarios para estudiar. `web/temas/` contiene los JSON editables. No se han cambiado las preguntas ni los identificadores.

Node.js sólo es necesario para compilar o ejecutar comprobaciones, no para estudiar. Desde esta carpeta:

```powershell
node web/compilar-contenido.cjs
node web/validar-contenido.cjs
node web/pruebas-progreso.cjs
node web/pruebas-interfaz.cjs
```

No hay `package.json` ni instalación de dependencias porque estos scripts utilizan únicamente módulos estándar de Node.js. El contenido ya está compilado.

Los PDF, capturas, notas de desarrollo y herramientas históricas se conservan. Las herramientas de preparación de PDF requieren Python, Pillow/pypdf y Poppler según el script; no son requisitos de la web. No ejecutes los scripts históricos de preparación sobre los JSON actuales: pueden sobrescribir contenido. Las rutas antiguas que aparecen en documentos históricos son referencias al proyecto anterior; usa los comandos de este README.

## GitHub posteriormente

No se ha inicializado Git ni creado ningún repositorio. El `.gitignore` excluye temporales, ZIP, cachés y PDF de consulta; estos últimos siguen presentes en la carpeta local. Los HTML/CSS/JS de `web/dist/`, JSON de temas y herramientas de comprobación sí están preparados para versionarse. No se necesitan enlaces a la otra asignatura ni a la carpeta anterior.
