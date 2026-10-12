/* La interfaz usa los datos de contenido.js y las reglas de progreso.js. */
(() => {
  "use strict";
  const data = globalThis.StudyContent;
  const store = globalThis.StudyProgress;
  const $ = (id) => document.getElementById(id);
  // El texto importado se escapa antes de introducirlo en la interfaz.
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let storage;
  try { storage = window.localStorage; } catch { storage = null; }
  const loaded = store.load(storage);
  let progress = loaded.progress;
  let recoveryRequired = Boolean(loaded.recoveryRequired);
  let subjectId = data.subjects[0].id;
  let topicId = data.subjects[0].topics[0].id;
  let view = "tarjetas";
  let filter = null;
  let session = null;
  let selectedCaseId = null;
  const drafts = new Map();
  const subject = () => data.subjects.find((s) => s.id === subjectId);
  const topic = () => subject().topics.find((t) => t.id === topicId);
  const conceptLabel = (id) => topic().conceptLabels?.[id] || id;
  const date = (iso) => new Date(iso).toLocaleString("es-ES", {dateStyle:"medium",timeStyle:"short"});
  const notice = (message) => { $("mensaje").textContent = message; };
  function warning(message) {
    $("aviso-almacenamiento").hidden = !message;
    $("aviso-almacenamiento").textContent = message || "";
  }
  warning(loaded.warning);
  function persist() {
    if (recoveryRequired) {
      warning("El progreso guardado no se pudo leer. Tus nuevos cambios están solo en memoria. Importa una copia válida o reinicia con confirmación para recuperar el guardado; el dato anterior se conserva.");
      return false;
    }
    const result = store.save(storage, progress);
    warning(result.ok ? "" : "No se pudo guardar en este navegador. Tus cambios siguen en esta sesión: exporta una copia antes de cerrar. " + result.error);
    return result.ok;
  }
  function commit(collection, id, record) {
    const candidate = {...progress,[collection]:{...progress[collection],[id]:record}};
    try { store.makeExport(candidate,Date.now()); }
    catch (error) { notice("No se ha registrado este resultado. " + error.message); return {applied:false,saved:false}; }
    progress = candidate;
    return {applied:true,saved:persist()};
  }
  function sources(items = []) {
    return `<details class="fuentes"><summary>Consultar fuentes</summary><ul>${items.map((s) => `<li><strong>${esc(s.document)}</strong>: página ${esc(s.pdfPage)} del PDF${s.printedPage ? `, página impresa ${esc(s.printedPage)}` : ""}. ${esc(s.section)}.</li>`).join("")}</ul></details>`;
  }
  function due(card) { return !progress.cards[card.id] || Date.parse(progress.cards[card.id].dueAt) <= Date.now(); }
  function availableCards() { return topic().cards.filter((c) => !filter || c.concepts.includes(filter)); }
  function stats() {
    const t = topic();
    const lines = [["Pendientes",`${t.cards.filter(due).length} / ${t.cards.length}`],["Tarjetas valoradas",`${t.cards.filter((c) => progress.cards[c.id]).length} / ${t.cards.length}`],["Casos consultados",`${t.cases.filter((c) => progress.cases[c.id]).length} / ${t.cases.length}`],["Mapas completados",`${t.map && progress.maps[t.map.id] ? 1 : 0} / ${t.map ? 1 : 0}`]];
    $("estadisticas").innerHTML = lines.map(([label,value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("");
  }
  function startSession(mode = "due") {
    session = {mode,cards:availableCards().filter((c) => mode === "practice" || due(c)),index:0,revealed:false};
  }
  function filterBanner() {
    return filter ? `<div class="filtro"><p>Concepto: <strong>${esc(conceptLabel(filter))}</strong></p><button class="boton-secundario" data-action="clear-filter">Ver todo</button></div>` : "";
  }
  function renderCards() {
    if (!topic().cards.length) { renderPending("tarjetas"); return; }
    if (!session) startSession();
    const card = session.cards[session.index];
    if (!card) {
      const records = availableCards().map((c) => progress.cards[c.id]).filter(Boolean);
      const next = records.map((r) => r.dueAt).sort()[0];
      $("panel").innerHTML = filterBanner() + `<article class="tarjeta"><p class="etiqueta">Tarjetas</p><h2>${session.cards.length ? "Sesión terminada" : "No hay tarjetas pendientes"}</h2><p>${session.cards.length ? `Has valorado ${session.cards.length} tarjetas en esta sesión.` : "Puedes practicar ahora o volver cuando toque el siguiente repaso."}</p>${next ? `<p class="nota">Próximo repaso de estas tarjetas: ${esc(date(next))}.</p>` : ""}<div class="acciones"><button data-action="start-due">Revisar pendientes</button><button class="boton-secundario" data-action="start-practice">Practicar todas</button></div><p class="nota">Las valoraciones de práctica también actualizan la próxima fecha.</p></article>`;
      return;
    }
    $("panel").innerHTML = filterBanner() + `<article class="tarjeta" data-card-id="${esc(card.id)}" aria-labelledby="pregunta"><div class="meta"><span>${session.mode === "practice" ? "Práctica" : "Repaso pendiente"} · ${session.index + 1} de ${session.cards.length}</span><span class="concepto">${esc(conceptLabel(card.concepts[0]))}</span></div><p class="etiqueta">Pregunta</p><h2 id="pregunta">${esc(card.question)}</h2><p class="nota">Piensa la respuesta antes de revelarla.</p><button id="mostrar-respuesta" data-action="reveal-card" aria-controls="respuesta" aria-expanded="${session.revealed}" ${session.revealed ? "hidden" : ""}>Mostrar respuesta</button><section id="respuesta" class="respuesta" ${session.revealed ? "" : "hidden"} aria-labelledby="titulo-respuesta"><h3 id="titulo-respuesta" tabindex="-1">Respuesta</h3><p class="solucion">${session.revealed ? esc(card.answer) : ""}</p>${session.revealed && card.explanation ? `<p>${esc(card.explanation)}</p>` : ""}<p>¿Cómo lo recordabas?</p><div class="valoraciones">${[["again","No lo sabía"],["hard","Me costó"],["good","Bien"],["easy","Muy fácil"]].map(([rating,label]) => `<button data-rating="${rating}">${label}</button>`).join("")}</div><p class="nota">Es tu autoevaluación, sin corrección automática.</p></section>${sources(card.sources)}<div class="acciones"><button class="boton-secundario" data-action="start-practice">Practicar todas</button></div></article>`;
  }
  function caseDraft(c) {
    if (!drafts.has(c.id)) drafts.set(c.id,{answers:{...(progress.cases[c.id]?.answers || {elastic:"",elongation:"",reason:""})},revealed:false});
    return drafts.get(c.id);
  }
  function caseOptions(value, options) {
    return `<option value="">Elige tu predicción</option>${options.map((x) => `<option ${value === x ? "selected" : ""}>${esc(x)}</option>`).join("")}`;
  }
  function renderCases() {
    if (!topic().cases.length) { renderPending("casos"); return; }
    const cases = topic().cases.filter((c) => !filter || c.concepts.includes(filter));
    if (!cases.length) {
      $("panel").innerHTML = filterBanner() + `<article class="tarjeta"><h2>No hay casos de este concepto</h2><button data-action="clear-filter">Ver todos los casos</button></article>`;
      return;
    }
    const selected = cases.find((c) => c.id === selectedCaseId) || cases[0];
    selectedCaseId = selected.id;
    const selector = cases.length > 1 ? `<label class="selector-caso">Caso<select data-case-selector="true">${cases.map((c,i) => `<option value="${esc(c.id)}" ${c.id === selected.id ? "selected" : ""}>${i + 1}. ${esc(c.title)}</option>`).join("")}</select></label>` : "";
    $("panel").innerHTML = filterBanner() + selector + [selected].map((c) => {
      const draft = caseDraft(c);
      return `<article class="tarjeta" data-case-id="${esc(c.id)}"><p class="etiqueta">¿Qué pasaría si…?</p><h2>${esc(c.title)}</h2><p class="nota">${esc(c.kind)}</p><div class="situation"><h3>Situación inicial</h3><p>${esc(c.initial)}</p><h3>Qué cambia</h3><p>${esc(c.change)}</p><h3>Qué se mantiene</h3><p>${esc(c.constants)}</p></div><div class="caso-formulario"><label>${esc(c.prompts.elastic)}<select data-case="${esc(c.id)}" data-answer="elastic">${caseOptions(draft.answers.elastic,c.predictionOptions?.elastic || c.options)}</select></label><label>${esc(c.prompts.elongation)}<select data-case="${esc(c.id)}" data-answer="elongation">${caseOptions(draft.answers.elongation,c.predictionOptions?.elongation || c.options)}</select></label><label>${esc(c.prompts.reason)}<textarea data-case="${esc(c.id)}" data-answer="reason" maxlength="2000" placeholder="Escribe tu razonamiento antes de consultar la solución.">${esc(draft.answers.reason)}</textarea></label></div><button data-action="reveal-case" data-id="${esc(c.id)}" ${draft.revealed ? "hidden" : ""}>Comparar con la solución</button>${draft.revealed ? `<section class="respuesta" aria-labelledby="solucion-${esc(c.id)}"><h3 id="solucion-${esc(c.id)}" tabindex="-1">Solución razonada</h3><p>${esc(c.solution)}</p><div class="criterios"><h3>Comprueba tu razonamiento</h3>${c.criteria.map((item) => `<label><input type="checkbox">${esc(item)}</label>`).join("")}</div><p class="nota">Estos criterios te ayudan a comparar tu respuesta. No se corrige automáticamente.</p><button class="boton-secundario" data-action="retry-case" data-id="${esc(c.id)}">Intentarlo otra vez</button></section>` : ""}${sources(c.sources)}</article>`;
    }).join("");
  }
  function mapDraft() {
    const id = topic().map.id;
    if (!drafts.has(id)) drafts.set(id,{answers:{process:"",relation:""},checked:false,solution:false});
    return drafts.get(id);
  }
  function blankSelect(key, blank, draft) {
    return `<label>${esc(blank.question)}<select data-map-answer="${key}"><option value="">Selecciona una opción</option>${blank.options.map((x) => `<option ${draft.answers[key] === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label><details class="pista"><summary>Pista opcional</summary><p>${esc(blank.hint)}</p></details>`;
  }
  function node(text, concepts) {
    if (concepts.length) return `<button class="nodo" data-concept="${esc(concepts[0])}">${esc(text)}</button>`;
    return `<strong>${esc(text)}</strong>`;
  }
  function renderMap() {
    if (!topic().map) { renderPending("mapa"); return; }
    const map = topic().map;
    const draft = mapDraft();
    const correct = Object.entries(map.blanks).every(([key,blank]) => draft.answers[key] === blank.answer);
    const groups = new Map();
    map.edges.forEach((edge,i) => {
      let start = node(edge.from,edge.concepts);
      let middle = `<span class="conexion">${esc(edge.relation)}</span>`;
      let end = `<strong>${esc(edge.to)}</strong>`;
      if (!draft.solution) for (const [key,blank] of Object.entries(map.blanks)) {
        if (blank.edgeIndex !== i) continue;
        if (blank.target === "from") start = blankSelect(key,blank,draft);
        if (blank.target === "to") end = blankSelect(key,blank,draft);
        if (blank.target === "relation") middle = blankSelect(key,blank,draft);
      }
      const group = edge.group || "Relaciones";
      if (!groups.has(group)) groups.set(group,[]);
      groups.get(group).push(`<div class="relacion"><div class="cadena">${start} ${middle} ${end}</div>${sources(edge.sources)}</div>`);
    });
    const relations = [...groups].map(([label,rows],i) => i === 0
      ? `<h3>${esc(label)}</h3>${rows.join("")}`
      : `<details class="bloque-mapa" ${draft.solution ? "open" : ""}><summary>${esc(label)} · ${rows.length} relaciones</summary>${rows.join("")}</details>`
    ).join("");
    $("panel").innerHTML = `<article class="tarjeta"><p class="etiqueta">Reconstruye las relaciones</p><h2>${esc(map.title)}</h2><p>Completa los huecos. Pulsa un concepto para abrir sus actividades relacionadas.</p><div class="mapa-relaciones">${relations}</div>${draft.checked ? `<p class="resultado" role="status">${correct ? "Todos los huecos son correctos." : "Revisa las respuestas: hay algún hueco pendiente o incorrecto. Puedes usar las pistas."}</p>` : ""}${draft.solution ? `<section class="respuesta"><h3>Solución explicada</h3><p>${esc(map.solution)}</p><p class="nota">Consultar el mapa completo no marca por sí solo el ejercicio como completado.</p></section>` : ""}<div class="acciones"><button data-action="check-map" ${draft.solution ? "hidden" : ""}>Comprobar huecos</button><button data-action="show-map" class="boton-secundario" ${draft.solution ? "hidden" : ""}>Ver mapa completo</button><button data-action="retry-map" class="boton-secundario">Volver a completar</button></div><div id="actividades-concepto" class="accesos" hidden></div></article>`;
  }
  function renderPending(activity) {
    const names = {tarjetas:"Tarjetas de repaso", casos:"Casos razonados", mapa:"Mapas conceptuales"};
    $("panel").innerHTML = `<article class="tarjeta"><p class="etiqueta">Preparación de la asignatura</p><h2>${names[activity]}</h2><p>Este espacio está listo para incorporar tus apuntes de <strong>Gestión y Dirección de Proyectos</strong>.</p><p>El temario y las actividades se elaborarán a partir de los documentos de la asignatura, con referencias a sus páginas.</p><div class="respuesta"><h3>Material para empezar</h3><ul><li>Apuntes o diapositivas por tema.</li><li>Ejercicios resueltos, si los tienes.</li><li>Guía docente o índice del temario.</li></ul><p>Puedes colocar los documentos en la carpeta <strong>gestion-proyectos/materiales</strong> e indicar que ya están disponibles en este chat.</p></div><p class="nota">Aún no hay actividades de estudio. No se ha supuesto un programa oficial para esta asignatura.</p></article>`;
  }
  const testDrafts = new Map();
  function testDraft() {
    if (!testDrafts.has(topicId)) testDrafts.set(topicId,{answers:{},checked:false});
    return testDrafts.get(topicId);
  }
  function renderTest() {
    const draft=testDraft(), questions=topic().tests || [];
    const correct=questions.filter(q=>draft.answers[q.id]===q.correct).length;
    const answered=questions.filter(q=>Number.isInteger(draft.answers[q.id])).length;
    const wrong=answered-correct, score=correct-wrong*0.25;
    $("panel").innerHTML=`<article class="tarjeta"><p class="etiqueta">Test de práctica · Tema ${topic().number}</p><h2>Comprueba lo que recuerdas</h2><p>Preguntas de elaboración propia. Puntuación de práctica: +1 por acierto, −0,25 por error y 0 por omisión. No establece las reglas de tu próximo examen.</p><p class="nota">Las respuestas del test se conservan mientras esta página esté abierta; no forman parte del progreso exportado.</p>${draft.checked ? `<p class="resultado" role="status">${correct} aciertos · ${wrong} errores · ${questions.length-answered} sin responder. Puntuación: ${score.toLocaleString('es-ES')} / ${questions.length}.</p>` : ''}${questions.map((q,i)=>`<fieldset class="pregunta-test"><legend>${i+1}. ${esc(q.question)}</legend>${q.options.map((o,j)=>`<label><input type="radio" name="${esc(q.id)}" data-test="${esc(q.id)}" value="${j}" ${draft.answers[q.id]===j?'checked':''} ${draft.checked?'disabled':''}> ${esc(o)}</label>`).join('')}<label><input type="radio" name="${esc(q.id)}" data-test="${esc(q.id)}" value="" ${!Number.isInteger(draft.answers[q.id])?'checked':''} ${draft.checked?'disabled':''}> Dejar sin responder</label>${draft.checked?`<div class="respuesta"><p><strong>${draft.answers[q.id]===q.correct?'Correcta':Number.isInteger(draft.answers[q.id])?'Incorrecta':'Sin responder'}.</strong> Respuesta: ${esc(q.options[q.correct])}.</p><p>${esc(q.explanation)}</p>${sources(q.sources)}</div>`:''}</fieldset>`).join('')}<div class="acciones"><button data-action="check-test" ${draft.checked?'hidden':''}>Corregir test</button><button data-action="retry-test" class="boton-secundario">Empezar de nuevo</button></div></article>`;
  }
  function render() {
    $("numero-tema").textContent = topic().number ? `Tema ${topic().number}` : "Preparación";
    $("titulo-tema").textContent = topic().title;
    $("alcance-tema").textContent = topic().number ? `Practica este tema: ${topic().cards.length} tarjetas, ${topic().cases.length} casos, ${topic().map ? 1 : 0} mapa y ${(topic().tests || []).length} preguntas de test.` : "Incorporaremos aquí las actividades a partir de tus documentos.";
    $("estado-contenido").textContent = topic().number ? `${subject().topics.length} temas · ${topic().cards.length} tarjetas en este tema` : "Pendiente de incorporar tus apuntes";
    document.querySelectorAll("[data-view]").forEach((button) => {
      const selected = button.dataset.view === view; button.setAttribute("aria-selected",String(selected)); button.tabIndex = selected ? 0 : -1;
    });
    $("panel").setAttribute("aria-labelledby",`tab-${view}`);
    ({tarjetas:renderCards,casos:renderCases,mapa:renderMap,test:renderTest})[view](); stats();
  }
  function navigate(next, concept = null) {
    if (!["tarjetas","casos","mapa","test"].includes(next)) throw new Error("Actividad desconocida.");
    view = next; filter = concept; session = null;
    notice("");
    if (concept && next === "tarjetas" && !availableCards().some(due)) startSession("practice");
    render();
  }
  function setTopicOptions() {
    $("tema").innerHTML = subject().topics.map((t) => `<option value="${esc(t.id)}">${t.number ? `${t.number}. ` : ""}${esc(t.title)}</option>`).join(""); $("tema").value = topicId;
  }
  $("asignatura").innerHTML = data.subjects.map((s) => `<option value="${esc(s.id)}">${esc(s.title)}</option>`).join("");
  setTopicOptions();
  $("indice-temas").innerHTML = subject().topics.map(t => `<section class="entrada-indice"><h2><button class="boton-secundario" data-topic="${esc(t.id)}">${t.number ? `${t.number}. ` : ""}${esc(t.title)}</button></h2><p class="nota">${t.cards.length} tarjetas · ${t.cases.length} casos · ${t.map ? 1 : 0} mapas</p><div class="acciones">${Object.entries(t.conceptLabels).map(([id,label])=>`<button class="nodo" data-topic="${esc(t.id)}" data-topic-concept="${esc(id)}">${esc(label)}</button>`).join('')}</div></section>`).join('');
  $("indice-temas").addEventListener("click",event => {
    const button = event.target.closest('[data-topic]'); if(!button) return;
    topicId=button.dataset.topic; $("tema").value=topicId;
    navigate('tarjetas',button.dataset.topicConcept || null);
    document.querySelector('.indice').open=false; $("panel").focus();
  });
  $("asignatura").addEventListener("change",(event) => { subjectId = event.target.value; topicId = subject().topics[0].id; filter = null; session = null; setTopicOptions(); render(); });
  $("tema").addEventListener("change",(event) => { topicId = event.target.value; filter = null; session = null; render(); });
  document.querySelector(".pestanas").addEventListener("click",(event) => {
    const button = event.target.closest("[data-view]"); if (button) { navigate(button.dataset.view); notice(""); }
  });
  document.querySelector(".pestanas").addEventListener("keydown",(event) => {
    if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
    event.preventDefault(); const views = ["tarjetas","casos","mapa","test"]; let index = views.indexOf(view);
    index = event.key === "Home" ? 0 : event.key === "End" ? views.length-1 : (index + (event.key === "ArrowRight" ? 1 : -1) + views.length) % views.length;
    navigate(views[index]); $(`tab-${view}`).focus();
  });
  $("panel").addEventListener("input",(event) => {
    const field = event.target;
    if (field.dataset.test && !testDraft().checked) testDraft().answers[field.dataset.test] = field.value === "" ? null : Number(field.value);
    if (field.dataset.caseSelector) { selectedCaseId = field.value; notice(""); render(); $("panel").querySelector("[data-case-selector]")?.focus(); }
    if (field.dataset.case) caseDraft(topic().cases.find((c) => c.id === field.dataset.case)).answers[field.dataset.answer] = field.value;
    if (field.dataset.mapAnswer) {
      const draft = mapDraft(); draft.answers[field.dataset.mapAnswer] = field.value; draft.checked = false;
      $("panel").querySelector(".resultado")?.remove();
    }
  });
  $("panel").addEventListener("click",(event) => {
    const button = event.target.closest("button"); if (!button) return;
    if (button.dataset.action === "check-test") { testDraft().checked=true; render(); return; }
    if (button.dataset.action === "retry-test") { testDrafts.delete(topicId); render(); return; }
    if (button.dataset.rating && session?.revealed) {
      const card = session.cards[session.index];
      const record = store.schedule(progress.cards[card.id],button.dataset.rating,Date.now());
      const result = commit("cards",card.id,record);
      if (!result.applied) return;
      session.index++; session.revealed = false; render();
      notice(`${result.saved ? "Valoración guardada." : "Valoración en esta sesión."} Próximo repaso: ${date(record.dueAt)}.`); $("panel").focus(); return;
    }
    if (button.dataset.concept) {
      const concept = button.dataset.concept;
      const cards = topic().cards.filter((c) => c.concepts.includes(concept)).length;
      const cases = topic().cases.filter((c) => c.concepts.includes(concept)).length;
      const box = $("actividades-concepto"); box.hidden = false;
      box.innerHTML = `<p>Actividades de <strong>${esc(conceptLabel(concept))}</strong></p><div class="acciones">${cards ? `<button data-related-view="tarjetas" data-filter="${concept}">Ver tarjetas (${cards})</button>` : ""}${cases ? `<button data-related-view="casos" data-filter="${concept}" class="boton-secundario">Ver casos (${cases})</button>` : ""}</div>`;
      box.querySelector("button")?.focus(); return;
    }
    if (button.dataset.relatedView) { navigate(button.dataset.relatedView,button.dataset.filter); $("panel").focus(); return; }
    switch (button.dataset.action) {
      case "clear-filter": filter = null; session = null; render(); break;
      case "start-due": startSession(); render(); notice(""); break;
      case "start-practice": startSession("practice"); render(); notice(""); break;
      case "reveal-card": session.revealed = true; render(); $("titulo-respuesta").focus(); break;
      case "reveal-case": {
        const c = topic().cases.find((item) => item.id === button.dataset.id); const draft = caseDraft(c);
        if (!draft.answers.elastic || !draft.answers.elongation || !draft.answers.reason.trim()) {
          notice("Elige las dos predicciones y escribe tu razonamiento antes de comparar con la solución.");
          return;
        }
        draft.revealed = true;
        const result = commit("cases",c.id,{completedAt:new Date().toISOString(),answers:{...draft.answers}});
        render(); $(`solucion-${c.id}`).focus();
        if (result.applied) notice("Solución consultada. Compara tu razonamiento con los criterios."); break;
      }
      case "retry-case": caseDraft(topic().cases.find((c) => c.id === button.dataset.id)).revealed = false; notice(""); render(); break;
      case "check-map": {
        const map = topic().map; const draft = mapDraft(); draft.checked = true;
        if (Object.entries(map.blanks).every(([key,blank]) => draft.answers[key] === blank.answer)) { commit("maps",map.id,{completedAt:new Date().toISOString(),answers:{...draft.answers}}); }
        render(); break;
      }
      case "show-map": mapDraft().solution = true; render(); break;
      case "retry-map": drafts.delete(topic().map.id); render(); break;
    }
    if (["clear-filter","start-due","start-practice","retry-case","check-map","show-map","retry-map"].includes(button.dataset.action)) $("panel").focus();
  });
  let exportUrl = null;
  $("exportar").addEventListener("click",() => {
    try {
    const text = JSON.stringify(store.makeExport(progress,Date.now()));
    if (exportUrl) URL.revokeObjectURL(exportUrl);
    exportUrl = URL.createObjectURL(new Blob([text],{type:"application/json"}));
    $("texto-copia").value = text;
    $("descargar-copia").href = exportUrl;
    $("descargar-copia").download = `gestion-proyectos-progreso-${new Date().toISOString().slice(0,10)}.json`;
    $("copia-progreso").showModal();
    notice("Copia preparada. Descarga el archivo o conserva el texto de la copia.");
    } catch (error) { notice("No se pudo preparar la copia. " + error.message); }
  });
  $("cerrar-copia").addEventListener("click",() => $("copia-progreso").close());
  $("copia-progreso").addEventListener("close",() => { if (exportUrl) URL.revokeObjectURL(exportUrl); exportUrl = null; });
  $("importar").addEventListener("change",async (event) => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 8_400_000) throw new Error("La copia supera el límite de tamaño admitido (8,4 MB).");
      const text = await file.text();
      const candidate = store.mergeImport(progress,text); const saved = store.save(storage,candidate);
      if (!saved.ok) throw new Error("No se pudo guardar la copia: " + saved.error);
      progress = candidate; recoveryRequired = false; warning(""); drafts.clear(); session = null; render(); notice("Copia importada. Se ha conservado el registro más reciente de cada actividad.");
    } catch (error) { notice("No se ha importado ni cambiado tu progreso. " + error.message); }
    event.target.value = "";
  });
  $("reiniciar").addEventListener("click",() => $("confirmar-reinicio").showModal());
  $("cancelar-reinicio").addEventListener("click",() => $("confirmar-reinicio").close());
  $("borrar-progreso").addEventListener("click",() => {
    const candidate = store.fresh(); const result = store.save(storage,candidate);
    if (!result.ok) { warning("No se pudo reiniciar el progreso. " + result.error); $("confirmar-reinicio").close(); return; }
    progress = candidate; recoveryRequired = false; warning(""); drafts.clear(); session = null; render(); $("confirmar-reinicio").close(); notice("Progreso reiniciado en este navegador.");
  });
  // Una segunda pestaña puede cambiar el progreso mientras esta está abierta.
  window.addEventListener("storage",(event) => {
    if (event.key !== "gestion-proyectos-progreso-v1" && event.key !== null) return;
    const update = store.load(storage); progress = update.progress; recoveryRequired = Boolean(update.recoveryRequired); warning(update.warning); session = null; render(); notice("Progreso actualizado desde otra pestaña. Tus respuestas en curso se conservan.");
  });
  render(); setInterval(stats,60_000);

  // Integración opcional; la web funciona en navegadores sin WebMCP.
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController(); window.addEventListener("pagehide",() => lifecycle.abort(),{once:true});
    const register = (tool) => { try { Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(() => {}); } catch { /* La interfaz normal sigue disponible. */ } };
    register({name:"read_study_progress",description:"Consultar el tema y cantidades de tarjetas pendientes sin revelar soluciones.",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input) {
      if (!input || typeof input !== "object" || Object.keys(input).length) throw new Error("No se esperan parámetros.");
      return {subject:subject().title,topic:topic().title,pending:topic().cards.filter(due).length,cards:topic().cards.length,activity:view};
    }});
    register({name:"navigate_study_activity",description:"Abrir Tarjetas, Casos, Mapa o Test del tema seleccionado sin revelar ni valorar respuestas.",inputSchema:{type:"object",properties:{activity:{type:"string",enum:["tarjetas","casos","mapa","test"]}},required:["activity"],additionalProperties:false},annotations:{readOnlyHint:false},execute(input) {
      if (!input || typeof input !== "object" || Object.keys(input).length !== 1 || !["tarjetas","casos","mapa","test"].includes(input.activity)) throw new Error("Indica una actividad válida.");
      navigate(input.activity); return {activity:view,topic:topic().title};
    }});
  }
})();

