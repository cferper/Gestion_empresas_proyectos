from pathlib import Path
base=Path(__file__).parent
dist=base/'web'/'dist'
p=dist/'app.js'
s=p.read_text(encoding='utf-8')
s=s.replace('event.key === "End" ? 2 : (index + (event.key === "ArrowRight" ? 1 : -1) + 3) % 3','event.key === "End" ? views.length-1 : (index + (event.key === "ArrowRight" ? 1 : -1) + views.length) % views.length')
s=s.replace('["tarjetas","casos","mapa"]','["tarjetas","casos","mapa","test"]')
s=s.replace('Abrir Tarjetas, Casos o Mapa','Abrir Tarjetas, Casos, Mapa o Test')
s=s.replace(' casos y ${topic().map ? 1 : 0} mapa conceptual.',' casos, ${topic().map ? 1 : 0} mapa y ${(topic().tests || []).length} preguntas de test.')
p.write_text(s,encoding='utf-8')
p=dist/'index.html';s=p.read_text(encoding='utf-8')
s=s.replace('Web de estudio de Gestión y Dirección de Proyectos: tarjetas, casos y mapas. Pendiente de incorporar el temario.','Estudia los seis primeros temas de GEP con tarjetas, casos razonados, mapas y tests basados en el libro de la asignatura.')
s=s.replace('Pendiente de incorporar tus apuntes','Temas 1–6 · Libro GEP')
s=s.replace('Las tres actividades pertenecen al tema seleccionado.','Las cuatro actividades pertenecen al tema seleccionado.')
s=s.replace('El índice se organizará según los archivos de la asignatura cuando se incorporen.','Los seis primeros capítulos de Gestión de Empresas y Proyectos, según el libro oficial facilitado.')
s=s.replace('Todavía no se han incorporado documentos de esta asignatura. Las actividades tendrán referencias a tus apuntes.','Actividades propias con referencias al libro: página del PDF y página impresa. Los exámenes orientan la práctica; consulta la guía para las discrepancias entre fuentes.')
s=s.replace('Estructura lista para incorporar el temario de la asignatura.','GEP · Temas 1–6 · Repaso basado en tus materiales.')
s=s.replace('<option value="pendiente">Temario pendiente</option>','<option value="gep-t1">1. La dirección empresarial</option>')
s=s.replace('<p id="numero-tema" class="etiqueta">Preparación</p>','<p id="numero-tema" class="etiqueta">Tema 1 de 6</p>')
s=s.replace('<h1 id="titulo-tema">Tu espacio de estudio</h1>','<h1 id="titulo-tema">La dirección empresarial</h1>')
s=s.replace('        </div>\n        <!-- JavaScript coloca aquí la actividad elegida. -->','          <button id="tab-test" type="button" role="tab" data-view="test" aria-selected="false" aria-controls="panel" tabindex="-1">Test</button>\n        </div>\n        <!-- JavaScript coloca aquí la actividad elegida. -->')
p.write_text(s,encoding='utf-8')
with (dist/'estilos.css').open('a',encoding='utf-8') as f:
 f.write('\n.pregunta-test { margin: 1.5rem 0; padding: 1rem; border: 1px solid var(--borde); border-radius: .6rem; min-width: 0; }\n.pregunta-test legend { font-weight: 700; padding: 0 .3rem; }\n.pregunta-test label { display: flex; align-items: baseline; gap: .5rem; margin: .6rem 0; font-weight: 400; cursor: pointer; }\n.pregunta-test input { width: auto; flex-shrink: 0; }\n')
(dist/'guia.html').write_text('''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Guía · GEP</title><link rel="stylesheet" href="estilos.css"></head>
<body><header class="cabecera"><div class="marca"><span class="simbolo" aria-hidden="true">GP</span><span>Gestión y Dirección de Proyectos</span></div></header><main><article class="tarjeta"><p><a href="index.html">← Volver al estudio</a></p><h1>Estudiar los seis primeros temas</h1>
<p>Esta web adapta la herramienta de Aleaciones a GEP. El índice sigue el libro oficial facilitado, titulado <em>Gestión de Empresas y Proyectos</em>, ETSIAE UPM, edición de octubre de 2025. Contiene actividades de elaboración propia: 165 tarjetas, 23 casos, 6 mapas y 36 preguntas de test. No es una transcripción del libro ni un banco oficial de preguntas.</p>
<h2>Cómo estudiar</h2><ul><li><strong>Tarjetas:</strong> intenta recordar antes de revelar y valora tu recuerdo para programar el siguiente repaso.</li><li><strong>Casos:</strong> elige dos predicciones, escribe el razonamiento y compara con la solución y sus criterios. No hay corrección automática del texto.</li><li><strong>Mapa:</strong> completa dos relaciones y compruébalas. Pulsar conceptos abre actividades relacionadas. Consultar la solución no marca el mapa como completado.</li><li><strong>Test:</strong> responde o deja preguntas en blanco y corrige al terminar. Cada respuesta incluye explicación y referencia. La puntuación de práctica es +1/−0,25/0; no establece las reglas del próximo examen.</li></ul>
<h2>Fuentes y alcance</h2><p>Se revisaron visualmente las páginas escaneadas correspondientes a los seis capítulos del libro. Los apuntes complementarios de los temas 1–4 se usaron para contrastar terminología. Se revisaron las preguntas del PEI 2024–25 y el documento de soluciones del Ordinario 2023–24 para orientar tipos de ejercicios; no se afirma una revisión exhaustiva de todos los exámenes de la carpeta. Las soluciones de la web son propias y explicadas.</p>
<table><thead><tr><th>Tema</th><th>Páginas PDF</th><th>Páginas impresas</th></tr></thead><tbody><tr><td>1. Dirección empresarial</td><td>6–33</td><td>1–28</td></tr><tr><td>2. Financiación y sistema financiero</td><td>34–47</td><td>29–42</td></tr><tr><td>3. Gestión económico-financiera</td><td>48–85</td><td>43–80</td></tr><tr><td>4. Personas y conocimiento</td><td>86–109</td><td>81–104</td></tr><tr><td>5. Marketing</td><td>110–125</td><td>105–120</td></tr><tr><td>6. Calidad</td><td>126–147</td><td>121–142</td></tr></tbody></table>
<p>Cada actividad indica el archivo original y la página. La numeración PDF cuenta desde la primera hoja del archivo; la impresa es la del libro. Los documentos originales permanecen en la carpeta materiales y no se incluyen en el paquete de la web. Las referencias sirven para localizarlos en tu copia.</p>
<h2>Criterios ante discrepancias</h2><ul><li><strong>Ratios:</strong> se usa la nomenclatura del libro, PDF 67–68: liquidez = AC/PC; acidez = (AC−existencias)/PC; disponibilidad o tesorería = disponible/PC. Algunos apuntes intercambian los nombres.</li><li><strong>ROE:</strong> el libro, PDF 75, usa BAI/PN, mientras algunos apuntes y el PEI 2024–25 usan BN/PN. Los ejercicios indican expresamente el numerador y muestran ambas convenciones cuando procede.</li><li><strong>Autofinanciación:</strong> se resta el dividendo del cash-flow económico siguiendo la definición del PDF 82. Las sumas de dividendos de otros párrafos (PDF 77 y 84) contradicen esa definición.</li><li><strong>Ejemplos numéricos:</strong> en PDF 43 aparece 320,33 en un paso del ejemplo de ampliación, aunque el cociente es 320,83. El préstamo francés de PDF 46 tiene una referencia a tres años pese al plazo de cuatro y cifras que no cuadran con su cuota matemática. Se usan ejemplos propios recalculados.</li><li><strong>Ansoff y BCG:</strong> producto nuevo y mercado nuevo no permiten asignar un cuadrante BCG sin conocer crecimiento y cuota relativa. Los casos explican qué datos faltan.</li><li><strong>Manual de calidad:</strong> PDF 139 y 141 contienen formulaciones distintas sobre su obligatoriedad. Se distingue información documentada requerida de una estructura de manual ilustrativa.</li><li><strong>Ediciones normativas:</strong> ISO 9001:2015, EN 9100:2016 y el esquema EFQM se presentan como aparecen en el libro de estudio. No se afirma que sean las versiones vigentes hoy.</li></ul>
<h2>Guardar el progreso</h2><p>Tarjetas, casos y mapas se guardan en este navegador, por separado de Aleaciones. Exporta una copia JSON para conservarlos o trasladarlos; no hay sincronización entre dispositivos. Las respuestas del test sólo duran mientras la página está abierta y no se exportan. Borrar datos del navegador puede borrar el progreso.</p>
<h2>Abrir y editar la web</h2><p>Abre index.html en un navegador. Funciona sin conexión y sin instalación. Para compartirla, envía la carpeta completa o el ZIP y extrae sus archivos antes de abrirla. No está publicada en Internet. Los temas editables están en web/temas; tras modificarlos, ejecuta el compilador indicado en el README para regenerar contenido.js.</p>
</article></main></body></html>''',encoding='utf-8')
(base/'README.md').write_text('''# Gestión y Dirección de Proyectos · GEP

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
''',encoding='utf-8')
