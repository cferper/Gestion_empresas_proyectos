"use strict";

// Pruebas del comportamiento que debe mantenerse aunque cambie la pantalla.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, "dist", "progreso.js"), "utf8"), context);
const Progress = context.StudyProgress;
const NOW = Date.parse("2026-10-02T10:00:00.000Z");
const DAY = 86400000;
const KEY = "gestion-proyectos-progreso-v1";
const clone = (value) => JSON.parse(JSON.stringify(value));
let passed = 0;

function test(name, run) {
  try {
    run();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

function storage(initial) {
  const entries = new Map();
  if (initial !== undefined) entries.set(KEY, initial);
  const fake = {
    writes: 0,
    getItem(key) { return entries.has(key) ? entries.get(key) : null; },
    setItem(key, value) { fake.writes += 1; entries.set(key, value); }
  };
  return fake;
}

function sample(time = NOW) {
  const progress = Progress.fresh();
  progress.cards["t1-acritud-proceso"] = Progress.schedule(null, "good", time);
  progress.cases["t1-recocido"] = {
    completedAt: new Date(time).toISOString(),
    answers: { elastic: "disminuye", elongation: "aumenta", reason: "Se reduce la acritud." }
  };
  progress.maps["t1-mapa"] = {
    completedAt: new Date(time).toISOString(),
    answers: { process: "deformación plástica en frío", relation: "disminuye" }
  };
  return progress;
}

test("cada progreso nuevo empieza vacío y es independiente", () => {
  const a = Progress.fresh();
  const b = Progress.fresh();
  assert.deepEqual(clone(a), { version: 1, cards: {}, cases: {}, maps: {} });
  a.cards.example = {};
  assert.equal(Object.keys(b.cards).length, 0);
});

test("los cuatro intervalos iniciales y fechas son exactos", () => {
  for (const [rating, interval, delay] of [
    ["again", 0, 600000], ["hard", 2, 2 * DAY],
    ["good", 3, 3 * DAY], ["easy", 7, 7 * DAY]
  ]) {
    const record = Progress.schedule(null, rating, NOW);
    assert.equal(record.intervalDays, interval);
    assert.equal(record.reviews, 1);
    assert.equal(record.reviewedAt, "2026-10-02T10:00:00.000Z");
    assert.equal(Date.parse(record.dueAt) - NOW, delay);
  }
});

test("Bien y Fácil amplían el intervalo y Difícil redondea hacia arriba", () => {
  const last = Progress.schedule(null, "good", NOW);
  const before = JSON.stringify(last);
  assert.equal(Progress.schedule(last, "hard", NOW + 3 * DAY).intervalDays, 4);
  assert.equal(Progress.schedule(last, "good", NOW + 3 * DAY).intervalDays, 6);
  assert.equal(Progress.schedule(last, "easy", NOW + 3 * DAY).intervalDays, 9);
  assert.equal(Progress.schedule(last, "good", NOW + 3 * DAY).reviews, 2);
  assert.equal(JSON.stringify(last), before);
});

test("Otra vez reinicia el intervalo y permite volver a los plazos iniciales", () => {
  const last = Progress.schedule(null, "easy", NOW);
  const again = Progress.schedule(last, "again", NOW + 7 * DAY);
  assert.equal(again.intervalDays, 0);
  assert.equal(again.reviews, 2);
  assert.equal(Date.parse(again.dueAt) - Date.parse(again.reviewedAt), 600000);
  assert.equal(Progress.schedule(again, "good", NOW + 7 * DAY + 600000).intervalDays, 3);
  assert.equal(Progress.schedule(again, "easy", NOW + 7 * DAY + 600000).intervalDays, 7);
});

test("los intervalos tienen un límite de 365 días", () => {
  let last = Progress.schedule(null, "easy", NOW);
  for (let iteration = 0; iteration < 8; iteration += 1) {
    last = Progress.schedule(last, "easy", Date.parse(last.dueAt));
  }
  assert.equal(last.intervalDays, 365);
  assert.equal(Date.parse(last.dueAt) - Date.parse(last.reviewedAt), 365 * DAY);
  assert.equal(Progress.schedule(last, "hard", Date.parse(last.dueAt)).intervalDays, 365);
});

test("un repaso tardío programa desde el momento de la valoración", () => {
  const last = Progress.schedule(null, "good", NOW);
  const late = NOW + 20 * DAY;
  const next = Progress.schedule(last, "good", late);
  assert.equal(Date.parse(next.reviewedAt), late);
  assert.equal(Date.parse(next.dueAt), late + 6 * DAY);
});

test("la duración UTC se mantiene al cambiar el horario de verano", () => {
  const beforeChange = Date.parse("2026-10-24T10:00:00.000Z");
  const record = Progress.schedule(null, "good", beforeChange);
  assert.equal(record.dueAt, "2026-10-27T10:00:00.000Z");
  assert.equal(Date.parse(record.dueAt) - beforeChange, 3 * DAY);
});

test("se rechazan valoraciones, momentos y registros anteriores inválidos", () => {
  assert.throws(() => Progress.schedule(null, "medium", NOW), /valoración/);
  for (const time of [NaN, Infinity, "2026-10-02", NOW + 0.5, 8.64e15]) {
    assert.throws(() => Progress.schedule(null, "good", time), /momento/);
  }
  const invalid = clone(Progress.schedule(null, "good", NOW));
  invalid.reviews = -1;
  assert.throws(() => Progress.schedule(invalid, "good", NOW), /repasos/);
});

test("un almacenamiento vacío devuelve progreso nuevo sin avisos", () => {
  const result = Progress.load(storage());
  assert.equal(result.warning, null);
  assert.equal(result.recoveryRequired, false);
  assert.deepEqual(clone(result.progress), clone(Progress.fresh()));
});

test("guardar y cargar conservan tarjetas, casos y mapas", () => {
  const fake = storage();
  const initial = sample();
  assert.deepEqual(clone(Progress.save(fake, initial)), { ok: true, error: null });
  assert.equal(fake.writes, 1);
  assert.deepEqual(clone(Progress.load(fake).progress), clone(initial));
  assert.equal(Progress.load(fake).warning, null);
});

test("una escritura fallida devuelve un error visible sin modificar la copia", () => {
  const fake = storage(JSON.stringify(sample()));
  const previous = fake.getItem(KEY);
  fake.setItem = () => { throw new Error("Cuota agotada"); };
  const result = Progress.save(fake, sample(NOW + DAY));
  assert.equal(result.ok, false);
  assert.match(result.error, /Cuota agotada/);
  assert.equal(fake.getItem(KEY), previous);
});

test("un fallo al leer informa y no solicita recuperación de datos corruptos", () => {
  const fake = { getItem() { throw new Error("Acceso bloqueado"); } };
  const result = Progress.load(fake);
  assert.match(result.warning, /leer/);
  assert.equal(result.recoveryRequired, false);
  assert.deepEqual(clone(result.progress), clone(Progress.fresh()));
});

test("un progreso ilegible permanece intacto y exige recuperación", () => {
  for (const raw of ["{", "", JSON.stringify({ version: 9 }), "x".repeat(2000001)]) {
    const fake = storage(raw);
    const result = Progress.load(fake);
    assert.equal(result.recoveryRequired, true);
    assert.match(result.warning, /conserva intacto/);
    assert.equal(fake.writes, 0);
    assert.equal(fake.getItem(KEY), raw);
    assert.deepEqual(clone(result.progress), clone(Progress.fresh()));
  }
});

test("un registro inválido se rechaza antes de escribir", () => {
  const fake = storage("copia que debe mantenerse");
  const invalid = sample();
  invalid.cards["t1-acritud-proceso"].dueAt = "2026-10-03T10:00:00.000Z";
  const result = Progress.save(fake, invalid);
  assert.equal(result.ok, false);
  assert.equal(fake.writes, 0);
  assert.equal(fake.getItem(KEY), "copia que debe mantenerse");
});

test("la exportación lleva versión, aplicación, fecha y una copia independiente", () => {
  const current = sample();
  const exported = Progress.makeExport(current, NOW);
  assert.equal(exported.app, "gestion-proyectos");
  assert.equal(exported.version, 1);
  assert.equal(exported.exportedAt, "2026-10-02T10:00:00.000Z");
  assert.deepEqual(clone(exported.progress), clone(current));
  exported.progress.cases["t1-recocido"].answers.reason = "Cambió la copia.";
  assert.equal(current.cases["t1-recocido"].answers.reason, "Se reduce la acritud.");
});

test("importar JSON y objetos de otro entorno produce el mismo resultado", () => {
  const wrapper = clone(Progress.makeExport(sample(), NOW));
  const fromText = Progress.mergeImport(Progress.fresh(), JSON.stringify(wrapper));
  const fromObject = Progress.mergeImport(Progress.fresh(), wrapper);
  assert.deepEqual(clone(fromText), clone(fromObject));
  assert.deepEqual(clone(fromObject), clone(wrapper.progress));
});

test("al fusionar gana la fecha de cada actividad y se conservan las actuales", () => {
  const current = sample(NOW);
  const incoming = sample(NOW + DAY);
  incoming.maps["t1-mapa"].completedAt = new Date(NOW - DAY).toISOString();
  incoming.maps["t1-mapa"].answers.relation = "respuesta antigua";
  current.cards["t1-exclusiva"] = Progress.schedule(null, "easy", NOW);
  const merged = Progress.mergeImport(current, Progress.makeExport(incoming, NOW + DAY));
  assert.equal(merged.cards["t1-acritud-proceso"].reviewedAt, incoming.cards["t1-acritud-proceso"].reviewedAt);
  assert.equal(merged.cases["t1-recocido"].completedAt, incoming.cases["t1-recocido"].completedAt);
  assert.equal(merged.maps["t1-mapa"].answers.relation, "disminuye");
  assert.ok(merged.cards["t1-exclusiva"]);
});

test("los empates conservan el registro actual", () => {
  const current = sample();
  const incoming = sample();
  incoming.cases["t1-recocido"].answers.reason = "Otra explicación con la misma fecha.";
  const merged = Progress.mergeImport(current, Progress.makeExport(incoming, NOW));
  assert.equal(merged.cases["t1-recocido"].answers.reason, current.cases["t1-recocido"].answers.reason);
});

test("se conservan identificadores válidos de temas todavía desconocidos", () => {
  const incoming = Progress.fresh();
  incoming.cards["t99.futuro:tarjeta-1"] = Progress.schedule(null, "good", NOW);
  const merged = Progress.mergeImport(Progress.fresh(), Progress.makeExport(incoming, NOW));
  assert.ok(merged.cards["t99.futuro:tarjeta-1"]);
});

test("la fusión no modifica ni comparte objetos con sus entradas", () => {
  const current = sample();
  const wrapper = Progress.makeExport(sample(NOW + DAY), NOW + DAY);
  const originalCurrent = JSON.stringify(current);
  const originalWrapper = JSON.stringify(wrapper);
  const merged = Progress.mergeImport(current, wrapper);
  merged.cases["t1-recocido"].answers.reason = "Cambio posterior.";
  merged.cards["t1-acritud-proceso"].reviews = 20;
  assert.equal(JSON.stringify(current), originalCurrent);
  assert.equal(JSON.stringify(wrapper), originalWrapper);
});

test("una actividad inválida al final cancela toda la importación", () => {
  const current = sample();
  const before = JSON.stringify(current);
  const wrapper = clone(Progress.makeExport(sample(NOW + DAY), NOW + DAY));
  wrapper.progress.maps["ultima-actividad"] = {
    completedAt: "fecha imposible", answers: { process: "frío", relation: "disminuye" }
  };
  assert.throws(() => Progress.mergeImport(current, wrapper), /fecha/);
  assert.equal(JSON.stringify(current), before);
});

test("se rechazan claves de contaminación de prototipos", () => {
  for (const key of ["__proto__", "constructor", "prototype"]) {
    const wrapper = clone(Progress.makeExport(sample(), NOW));
    Object.defineProperty(wrapper.progress.cards, key, {
      value: clone(Progress.schedule(null, "good", NOW)), enumerable: true
    });
    const text = JSON.stringify(wrapper);
    assert.throws(() => Progress.mergeImport(Progress.fresh(), text), /clave no permitida/);
  }
  assert.equal(Object.prototype.polluted, undefined);
});

test("se rechazan getters sin ejecutarlos, prototipos ajenos y símbolos", () => {
  const wrapper = clone(Progress.makeExport(sample(), NOW));
  let executed = false;
  Object.defineProperty(wrapper.progress.cards, "getter", {
    enumerable: true, get() { executed = true; return {}; }
  });
  assert.throws(() => Progress.mergeImport(Progress.fresh(), wrapper), /propiedad no permitida/);
  assert.equal(executed, false);
  const alien = clone(Progress.makeExport(sample(), NOW));
  Object.setPrototypeOf(alien.progress, { extra: "no" });
  assert.throws(() => Progress.mergeImport(Progress.fresh(), alien), /objeto sencillo/);
  const symbol = clone(Progress.makeExport(sample(), NOW));
  symbol.progress[Symbol("extra")] = true;
  assert.throws(() => Progress.mergeImport(Progress.fresh(), symbol), /clave no permitida/);
});

test("se rechazan fechas imposibles, contadores y tipos incoherentes", () => {
  const mutations = [
    (p) => { p.cards["t1-acritud-proceso"].reviewedAt = "2026-02-30T10:00:00.000Z"; },
    (p) => { p.cards["t1-acritud-proceso"].dueAt = "2026-10-05T12:00:00.000+02:00"; },
    (p) => { p.cards["t1-acritud-proceso"].rating = "unknown"; },
    (p) => { p.cards["t1-acritud-proceso"].reviews = 0; },
    (p) => { p.cards["t1-acritud-proceso"].reviews = 1.5; },
    (p) => { p.cards["t1-acritud-proceso"].reviews = 1000001; },
    (p) => { p.cards["t1-acritud-proceso"].intervalDays = -1; },
    (p) => { p.cards["t1-acritud-proceso"].intervalDays = 366; },
    (p) => { p.cases["t1-recocido"].answers.reason = 42; },
    (p) => { p.maps["t1-mapa"].answers.process = "a".repeat(2001); },
    (p) => { p.cards["bad/id"] = p.cards["t1-acritud-proceso"]; },
    (p) => { p.extra = "campo desconocido"; },
    (p) => { p.maps = []; }
  ];
  for (const mutate of mutations) {
    const wrapper = clone(Progress.makeExport(sample(), NOW));
    mutate(wrapper.progress);
    assert.throws(() => Progress.mergeImport(Progress.fresh(), wrapper));
  }
});

test("se rechazan archivos incompletos, de otra aplicación o demasiado grandes", () => {
  for (const raw of ["{", "null", "[]", "x".repeat(2000001)]) {
    assert.throws(() => Progress.mergeImport(Progress.fresh(), raw));
  }
  for (const mutate of [
    (w) => { w.app = "otra"; }, (w) => { w.version = 2; },
    (w) => { delete w.exportedAt; }, (w) => { w.extra = true; }
  ]) {
    const wrapper = clone(Progress.makeExport(sample(), NOW));
    mutate(wrapper);
    assert.throws(() => Progress.mergeImport(Progress.fresh(), wrapper));
  }
});

test("las cantidades y la suma de dos copias respetan el límite de actividades", () => {
  const current = Progress.fresh();
  const incoming = Progress.fresh();
  const record = Progress.schedule(null, "good", NOW);
  for (let i = 0; i < 2501; i += 1) {
    current.cards[`a-${i}`] = record;
    incoming.cards[`b-${i}`] = record;
  }
  const before = JSON.stringify(current);
  const wrapper = Progress.makeExport(incoming, NOW);
  assert.throws(() => Progress.mergeImport(current, wrapper), /límite/);
  assert.equal(JSON.stringify(current), before);
  for (let i = 2501; i < 5001; i += 1) incoming.cards[`b-${i}`] = record;
  assert.throws(() => Progress.makeExport(incoming, NOW), /límite/);
});

test("los objetos con prototipo nulo también son válidos", () => {
  const plain = Object.assign(Object.create(null), clone(sample()));
  plain.cards = Object.assign(Object.create(null), plain.cards);
  const wrapper = Progress.makeExport(plain, NOW);
  assert.deepEqual(clone(wrapper.progress), clone(sample()));
});

test("una copia con acentos cerca del límite puede exportarse e importarse", () => {
  const progress = Progress.fresh();
  const record = {
    completedAt: new Date(NOW).toISOString(),
    answers: { elastic: "á".repeat(2000), elongation: "ñ".repeat(2000), reason: "é".repeat(2000) }
  };
  const overhead = JSON.stringify(progress).length;
  // Las claves tienen longitud fija; cada entrada suma también la coma.
  const entryLength = JSON.stringify("t9-0000").length + 1 + JSON.stringify(record).length + 1;
  const count = Math.floor((1999900 - overhead) / entryLength);
  for (let index = 0; index < count; index += 1) {
    progress.cases[`t9-${String(index).padStart(4, "0")}`] = record;
  }
  const text = JSON.stringify(Progress.makeExport(progress, NOW));
  assert.ok(text.length > 1900000 && text.length <= 2100000);
  assert.ok(Buffer.byteLength(text, "utf8") > 2000000);
  assert.ok(Buffer.byteLength(text, "utf8") <= 8400000);
  assert.deepEqual(clone(Progress.mergeImport(Progress.fresh(), text)), clone(progress));
  // La cabecera tiene un límite propio, incluso si el progreso pequeño es válido.
  const padded = text + " ".repeat(2100001 - text.length);
  assert.throws(() => Progress.mergeImport(Progress.fresh(), padded), /demasiado grande/);
});

console.log(`\n${passed} pruebas superadas. No se han instalado dependencias.`);

