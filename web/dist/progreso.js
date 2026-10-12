// Este archivo contiene los datos de progreso y la regla de repaso.
// No necesita el HTML: así podemos comprobarlo también con Node.js.
(function (global) {
  "use strict";

  const STORAGE_KEY = "gestion-proyectos-progreso-v1";
  const DAY = 24 * 60 * 60 * 1000;
  const AGAIN_DELAY = 10 * 60 * 1000;
  const MAX_INTERVAL = 365;
  const MAX_RECORDS = 5000;
  const MAX_TEXT = 2000;
  const MAX_JSON = 2000000;
  // La copia incluye cabecera además del progreso, por eso tiene otro límite.
  const MAX_IMPORT_JSON = 2100000;
  const MAX_REVIEWS = 1000000;
  const RATINGS = new Set(["again", "hard", "good", "easy"]);
  const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

  function invalid(message) {
    throw new Error(message);
  }

  function fresh() {
    return { version: 1, cards: {}, cases: {}, maps: {} };
  }

  // Un objeto de otra ventana o del entorno de pruebas tiene otro prototipo.
  // Comprobamos su estructura, sin exigir que sea el Object de esta ventana.
  function objectKeys(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      invalid(`${label} debe ser un objeto.`);
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== null) {
      const constructor = Object.getOwnPropertyDescriptor(prototype, "constructor");
      if (Object.getPrototypeOf(prototype) !== null || !constructor ||
          !("value" in constructor) || typeof constructor.value !== "function" ||
          Function.prototype.toString.call(constructor.value) !==
            Function.prototype.toString.call(Object)) {
        invalid(`${label} debe ser un objeto sencillo.`);
      }
    }
    const keys = Reflect.ownKeys(value);
    for (const key of keys) {
      if (typeof key !== "string" || FORBIDDEN_KEYS.has(key)) {
        invalid(`${label} contiene una clave no permitida.`);
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor.enumerable || !("value" in descriptor)) {
        invalid(`${label} contiene una propiedad no permitida.`);
      }
    }
    return keys;
  }

  function exactKeys(value, expected, label) {
    const keys = objectKeys(value, label);
    if (keys.length !== expected.length || keys.some((key) => !expected.includes(key))) {
      invalid(`${label} tiene campos desconocidos o incompletos.`);
    }
  }

  function integer(value, min, max, label) {
    if (!Number.isSafeInteger(value) || value < min || value > max) {
      invalid(`${label} debe ser un entero entre ${min} y ${max}.`);
    }
    return value;
  }

  function isoDate(value, label) {
    if (typeof value !== "string" || value.length !== 24) {
      invalid(`${label} debe ser una fecha ISO en UTC.`);
    }
    const time = Date.parse(value);
    if (!Number.isFinite(time) || new Date(time).toISOString() !== value) {
      invalid(`${label} no es una fecha válida en UTC.`);
    }
    return value;
  }

  function timestamp(now) {
    const value = now === undefined ? Date.now() : now;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      invalid("El momento del repaso debe ser un número de milisegundos.");
    }
    // Evitamos desbordar el calendario al sumar hasta un año de repaso.
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() < 0 ||
        date.getUTCFullYear() > 9998 || !Number.isSafeInteger(value)) {
      invalid("El momento del repaso está fuera del calendario admitido.");
    }
    return value;
  }

  function cardRecord(value, label) {
    exactKeys(value, ["rating", "reviews", "intervalDays", "reviewedAt", "dueAt"], label);
    if (!RATINGS.has(value.rating)) invalid(`${label} tiene una valoración desconocida.`);
    const reviews = integer(value.reviews, 1, MAX_REVIEWS, `${label}: repasos`);
    const intervalDays = integer(value.intervalDays, 0, MAX_INTERVAL, `${label}: intervalo`);
    const reviewedAt = isoDate(value.reviewedAt, `${label}: último repaso`);
    const dueAt = isoDate(value.dueAt, `${label}: siguiente repaso`);
    const elapsed = Date.parse(dueAt) - Date.parse(reviewedAt);
    if ((value.rating === "again" && (intervalDays !== 0 || elapsed !== AGAIN_DELAY)) ||
        (value.rating !== "again" && (intervalDays === 0 || elapsed !== intervalDays * DAY))) {
      invalid(`${label} tiene un intervalo incoherente con sus fechas o valoración.`);
    }
    return { rating: value.rating, reviews, intervalDays, reviewedAt, dueAt };
  }

  function activityRecord(value, answerKeys, label) {
    exactKeys(value, ["completedAt", "answers"], label);
    const completedAt = isoDate(value.completedAt, `${label}: fecha de realización`);
    exactKeys(value.answers, answerKeys, `${label}: respuestas`);
    const answers = {};
    for (const key of answerKeys) {
      if (typeof value.answers[key] !== "string" || value.answers[key].length > MAX_TEXT) {
        invalid(`${label}: cada respuesta debe ser texto de hasta ${MAX_TEXT} caracteres.`);
      }
      answers[key] = value.answers[key];
    }
    return { completedAt, answers };
  }

  function validateProgress(value) {
    exactKeys(value, ["version", "cards", "cases", "maps"], "El progreso");
    if (value.version !== 1) invalid("La versión del progreso no es compatible.");
    const result = fresh();
    let recordCount = 0;
    for (const collection of ["cards", "cases", "maps"]) {
      const keys = objectKeys(value[collection], `La colección ${collection}`);
      recordCount += keys.length;
      if (recordCount > MAX_RECORDS) {
        invalid(`La copia supera el límite de ${MAX_RECORDS} actividades.`);
      }
      for (const id of keys) {
        if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(id)) {
          invalid("La copia contiene un identificador de actividad no válido.");
        }
        const label = `La actividad ${id}`;
        if (collection === "cards") {
          result.cards[id] = cardRecord(value.cards[id], label);
        } else {
          const answers = collection === "cases"
            ? ["elastic", "elongation", "reason"] : ["process", "relation"];
          result[collection][id] = activityRecord(value[collection][id], answers, label);
        }
      }
    }
    if (JSON.stringify(result).length > MAX_JSON) {
      invalid("La copia es demasiado grande (máximo: dos millones de caracteres).");
    }
    return result;
  }

  function load(storage) {
    let raw;
    try {
      if (!storage || typeof storage.getItem !== "function") {
        invalid("El navegador no ofrece almacenamiento local.");
      }
      raw = storage.getItem(STORAGE_KEY);
    } catch (error) {
      return {
        progress: fresh(),
        warning: "No se ha podido leer el progreso del navegador. Puedes estudiar y exportar una copia, pero el guardado puede no estar disponible.",
        recoveryRequired: false
      };
    }
    if (raw === null) return { progress: fresh(), warning: null, recoveryRequired: false };
    try {
      if (typeof raw !== "string" || raw.length > MAX_JSON) {
        invalid("El progreso guardado tiene un formato o tamaño no válido.");
      }
      return {
        progress: validateProgress(JSON.parse(raw)), warning: null, recoveryRequired: false
      };
    } catch (error) {
      return {
        progress: fresh(),
        warning: "El progreso guardado no se puede interpretar. Se conserva intacto; importa una copia válida o confirma un reinicio antes de volver a guardar.",
        recoveryRequired: true
      };
    }
  }

  function save(storage, progress) {
    try {
      // Validamos todo antes de escribir: una actividad errónea no daña la copia anterior.
      const copy = validateProgress(progress);
      if (!storage || typeof storage.setItem !== "function") {
        invalid("El navegador no ofrece almacenamiento local.");
      }
      storage.setItem(STORAGE_KEY, JSON.stringify(copy));
      return { ok: true, error: null };
    } catch (error) {
      return {
        ok: false,
        error: `No se ha podido guardar el progreso: ${error.message || "almacenamiento no disponible"} Puedes exportarlo para conservarlo.`
      };
    }
  }

  function schedule(previous, rating, now) {
    if (!RATINGS.has(rating)) invalid("La valoración del recuerdo no es válida.");
    const last = previous == null ? null : cardRecord(previous, "El repaso anterior");
    const time = timestamp(now);
    const previousInterval = last ? last.intervalDays : 0;
    let intervalDays;
    if (rating === "again") intervalDays = 0;
    if (rating === "hard") intervalDays = Math.max(1, Math.ceil(Math.max(previousInterval, 1) * 1.2));
    if (rating === "good") intervalDays = previousInterval === 0 ? 3 : Math.ceil(previousInterval * 2);
    if (rating === "easy") intervalDays = previousInterval === 0 ? 7 : Math.ceil(previousInterval * 3);
    intervalDays = Math.min(intervalDays, MAX_INTERVAL);
    const reviews = integer((last ? last.reviews : 0) + 1, 1, MAX_REVIEWS, "El número de repasos");
    return {
      rating,
      reviews,
      intervalDays,
      reviewedAt: new Date(time).toISOString(),
      dueAt: new Date(time + (rating === "again" ? AGAIN_DELAY : intervalDays * DAY)).toISOString()
    };
  }

  function makeExport(progress, now) {
    const wrapper = {
      app: "gestion-proyectos",
      version: 1,
      exportedAt: new Date(timestamp(now)).toISOString(),
      progress: validateProgress(progress)
    };
    if (JSON.stringify(wrapper).length > MAX_IMPORT_JSON) {
      invalid("La copia exportada es demasiado grande.");
    }
    return wrapper;
  }

  function mergeImport(current, raw) {
    // Primero se comprueba la copia completa; solo después se crea la fusión.
    // Nunca cambiamos current ni raw, tampoco si aparece un error al final del archivo.
    let wrapper = raw;
    if (typeof raw === "string") {
      if (raw.length > MAX_IMPORT_JSON) invalid("La copia importada es demasiado grande.");
      try {
        wrapper = JSON.parse(raw);
      } catch (error) {
        invalid("La copia importada no contiene JSON válido.");
      }
    }
    exactKeys(wrapper, ["app", "version", "exportedAt", "progress"], "La copia importada");
    if (wrapper.app !== "gestion-proyectos" || wrapper.version !== 1) {
      invalid("La copia no pertenece a Gestión y Dirección de Proyectos o usa una versión incompatible.");
    }
    isoDate(wrapper.exportedAt, "La fecha de exportación");
    const incoming = validateProgress(wrapper.progress);
    if (JSON.stringify({
      app: wrapper.app, version: wrapper.version,
      exportedAt: wrapper.exportedAt, progress: incoming
    }).length > MAX_IMPORT_JSON) {
      invalid("La copia importada es demasiado grande.");
    }
    const merged = validateProgress(current);
    for (const collection of ["cards", "cases", "maps"]) {
      const dateKey = collection === "cards" ? "reviewedAt" : "completedAt";
      for (const [id, record] of Object.entries(incoming[collection])) {
        if (!own(merged[collection], id) ||
            Date.parse(record[dateKey]) > Date.parse(merged[collection][id][dateKey])) {
          merged[collection][id] = record;
        }
      }
    }
    // Dos copias válidas podrían superar juntas los límites de almacenamiento.
    return validateProgress(merged);
  }

  global.StudyProgress = Object.freeze({ fresh, load, save, schedule, mergeImport, makeExport });
})(globalThis);
