// Todo lo que tiene que ver con guardar y leer pilotos en el localStorage.
// El localStorage es una memoria del navegador: guarda texto y no se borra
// al cerrar la pestaña. Por eso usamos JSON.stringify (objeto → texto)
// para guardar y JSON.parse (texto → objeto) para leer.

import destinosData from './destinos.js';
import { AVATARES } from './avatares.js';

// Nombres de las "cajitas" del localStorage
const CLAVE_USUARIOS = 'skyhopper:usuarios'; // todos los pilotos, uno por ID
const CLAVE_SESION = 'skyhopper:sesion';     // el ID del piloto que está jugando

export const AJUSTES_INICIALES = { volumen: 80, idioma: 'es' };

// Niveles del piloto según sus millas totales
export const TIERS = [
  { nombre: 'Bronze', desde: 0 },
  { nombre: 'Silver', desde: 200 },
  { nombre: 'Gold', desde: 500 },
  { nombre: 'Platinum', desde: 1000 },
];

// ---------- LEER Y ESCRIBIR EN EL LOCALSTORAGE ----------

// Lee TODOS los pilotos guardados. Si no hay nada (o falla), devuelve {}
function leerTodos() {
  try {
    const texto = localStorage.getItem(CLAVE_USUARIOS);
    return texto ? JSON.parse(texto) : {};
  } catch (error) {
    return {};
  }
}

function guardarTodos(usuarios) {
  try {
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
  } catch (error) {
    // Si el navegador no deja guardar, el juego sigue funcionando igual
  }
}

// Una "ficha" es toda la info de un piloto
function fichaNueva(passengerId, userName) {
  return {
    passengerId,
    userName,
    avatar: AVATARES[0].id,
    creado: Date.now(),
    millas: 0,
    xp: 0,
    vuelos: 0,                // cuántos vuelos completó
    millasPorDestino: {},     // por ejemplo { 1: 100, 2: 200 }
    destinosCompletados: [],  // ids de los destinos que ya completó
    desbloqueados: [],        // destinos que desbloqueó jugando
    ajustes: { ...AJUSTES_INICIALES },
  };
}

// Si una ficha vieja no tiene algún campo nuevo, se lo agregamos acá
function completarFicha(passengerId, guardada) {
  return {
    ...fichaNueva(passengerId, guardada.userName),
    ...guardada,
    ajustes: { ...AJUSTES_INICIALES, ...(guardada.ajustes || {}) },
  };
}

// ---------- USUARIOS ----------

export function limpiarId(id) {
  return id.trim().toUpperCase();
}

export function obtenerUsuario(passengerId) {
  const guardada = leerTodos()[passengerId];
  return guardada ? completarFicha(passengerId, guardada) : null;
}

export function guardarUsuario(ficha) {
  const todos = leerTodos();
  todos[ficha.passengerId] = ficha;
  guardarTodos(todos);
  return ficha;
}

// Cambia solo algunos campos de la ficha. Ejemplo:
//   actualizarUsuario('SH-1', { userName: 'Pato' })
export function actualizarUsuario(passengerId, cambios) {
  const actual = obtenerUsuario(passengerId);
  if (!actual) return null;
  return guardarUsuario({ ...actual, ...cambios });
}

// Vuelve a cero millas, XP, vuelos y destinos (conserva nombre, avatar y ajustes)
export function reiniciarProgreso(passengerId) {
  return actualizarUsuario(passengerId, {
    millas: 0,
    xp: 0,
    vuelos: 0,
    millasPorDestino: {},
    destinosCompletados: [],
    desbloqueados: [],
  });
}

// ---------- SESIÓN ----------

// Si el ID ya existe, recupera su progreso. Si no, crea una ficha nueva.
export function iniciarSesion(passengerId, userName) {
  const id = limpiarId(passengerId);
  const nombre = userName.trim();
  const existente = obtenerUsuario(id);

  const ficha = existente ? { ...existente, userName: nombre } : fichaNueva(id, nombre);
  guardarUsuario(ficha);

  try {
    localStorage.setItem(CLAVE_SESION, id);
  } catch (error) {
    // no pasa nada
  }
  return ficha;
}

// Devuelve el piloto que había iniciado sesión (o null)
export function sesionGuardada() {
  try {
    const id = localStorage.getItem(CLAVE_SESION);
    return id ? obtenerUsuario(id) : null;
  } catch (error) {
    return null;
  }
}

export function usuarioActual() {
  return sesionGuardada();
}

export function cerrarSesion() {
  try {
    localStorage.removeItem(CLAVE_SESION);
  } catch (error) {
    // no pasa nada
  }
}

// ---------- TIER (nivel del piloto) ----------

// Devuelve el tier actual, el siguiente y cuánto falta (progreso de 0 a 1)
export function calcularTier(millas) {
  let indice = 0;
  TIERS.forEach((tier, i) => {
    if (millas >= tier.desde) indice = i;
  });

  const actual = TIERS[indice];
  const siguiente = TIERS[indice + 1] || null;
  const progreso = siguiente
    ? (millas - actual.desde) / (siguiente.desde - actual.desde)
    : 1;

  return { actual, siguiente, progreso };
}

// ---------- LOGROS (medallas) ----------
// No se guardan: se calculan cada vez a partir de la ficha.

function armarLogro(id, nombre, descripcion, icono, actual, total) {
  return {
    id,
    nombre,
    descripcion,
    icono,
    total,
    actual: Math.min(actual, total),
    conseguido: actual >= total,
  };
}

export function calcularLogros(ficha) {
  const generales = [
    armarLogro('primer-vuelo', 'Primer vuelo', 'Completá tu primer vuelo', '🛫', ficha.vuelos, 1),
    armarLogro('piloto-frecuente', 'Piloto frecuente', 'Completá 5 vuelos', '🎖️', ficha.vuelos, 5),
    armarLogro('club-500', 'Club de las 500 millas', 'Sumá 500 millas', '🏆', ficha.millas, 500),
    armarLogro(
      'vuelta-al-mundo',
      'Vuelta al mundo',
      'Completá todos los destinos',
      '🌍',
      ficha.destinosCompletados.length,
      destinosData.length
    ),
  ];

  const porDestino = destinosData.map((d) =>
    armarLogro(
      `destino-${d.id}`,
      `Aterrizaje en ${d.detalle?.ciudad || d.nombre}`,
      `Completaste el vuelo a ${d.nombre}`,
      '📍',
      ficha.destinosCompletados.includes(d.id) ? 1 : 0,
      1
    )
  );

  return [...generales, ...porDestino];
}

// ---------- RANKING ----------
// Lee a TODOS los pilotos que ingresaron alguna vez en este navegador
// y los ordena por millas (de mayor a menor). Si dos tienen las mismas
// millas, queda primero el que se registró antes.
// No hay pilotos simulados: todos son personas reales.

export function armarRanking() {
  const todos = leerTodos();

  return Object.keys(todos)
    .map((id) => {
      const ficha = completarFicha(id, todos[id]);
      return {
        passengerId: id,
        userName: ficha.userName,
        avatar: ficha.avatar,
        millas: ficha.millas,
        creado: ficha.creado,
        medallas: calcularLogros(ficha).filter((l) => l.conseguido).length,
      };
    })
    .sort((a, b) => b.millas - a.millas || a.creado - b.creado);
}