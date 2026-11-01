import { useEffect, useRef } from "react";

// ===== AJUSTES: números que podés cambiar =====
const ANCHO = 1000;
const ALTO = 640;
const SUELO = 40;
const NITIDEZ_MAX = 2; // 2 = texto nítido en pantallas retina (poné 1 para volver a como estaba)

// Vuelo (estos valores son iguales en todos los países)
const SALTO = -6.4;
const MAX_CAIDA = 8.5;
const OBS_ANCHO = 64;
const MOSTRAR_CAJA = false; // poné true para ver la caja de choque del avión

// Dificultad por defecto. Cada país la pisa con su bloque "dificultad"
// de destinos.js (velocidad, hueco, separación, gravedad, turbulencia, niebla).
const DIFICULTAD_BASE = {
  nivel: 1,         // estrellas de dificultad (1 a 5): también define el aterrizaje
  desafio: "Cielo despejado",
  velocidad: 3.2,   // qué rápido avanzan los obstáculos
  hueco: 210,       // espacio para pasar (más chico = más difícil)
  separacion: 330,  // distancia entre obstáculos
  gravedad: 0.34,   // qué rápido cae el avión
  turbulencia: 0,   // 0 a 1: fuerza de las sacudidas
  niebla: 0,        // 0 a 1: cuánto tapa la niebla
};

// Avión (x = dónde está parado, w = ancho en pantalla)
const AVION = { x: 165, w: 150 };
const IMAGEN_AVION = "/imagenes/avion-latam.svg";

// Despegue
const Y_PISTA = 555;            // altura del avión apoyado en la pista
const Y_VUELO = 330;            // altura donde empieza el vuelo
const VEL_MIN = 0.45;           // velocidad mínima para poder levantar
const VEL_MAX = 1.4;
const RECORRIDO_ROTAR = 1200;   // cuánta pista hay que recorrer antes de levantar
const SUBIDA = 0.0003;          // qué rápido sube mientras apretás
const DURACION_TRANSICION = 2200; // ms que tarda el aeropuerto en aparecer / desaparecer
const BANDA_DESPEGUE = 40;      // la franja verde de altura de vuelo mide el doble de esto
const AVISO_LEVANTA = 1400;     // ms que se ve el cartel grande ¡LEVANTÁ!

// Aterrizaje
const VEL_SUELO = 4.2;               // qué rápido pasa la pista por debajo (px por frame)
const PISTA_LARGO = 2600;            // largo total de la pista
const PISTA_ARRANQUE = ANCHO + 120;  // dónde aparece el inicio de la pista (a la derecha)
const ZONA_DESDE = 420;              // la zona de toque empieza a esta distancia del inicio
const Y_TOQUE = Y_PISTA;             // altura del avión cuando toca la pista
const TIEMPO_ESTABILIZAR = 2400;     // ms dentro de la franja para quedar estabilizado
const SUBE_MAX = -1.9;               // velocidad vertical al mantener apretado (negativo = sube)
const BAJA_MAX = 2.4;                // velocidad vertical al soltar (positivo = baja)
const SUAVIZADO = 0.08;              // qué tan rápido responde el avión al apretar o soltar
const DURACION_RODAJE = 2200;        // ms que tarda en frenar sobre la pista

// Identidad SkyHopper
const AZUL = "#1B0088";
const ROJO = "#EB0045";
const CELESTE = "#007CE0";
const LILA = "#c9d0ff";
const VERDE = "#2BD67B";
const FUENTE = "Sora, Arial, sans-serif";

// El aterrizaje se vuelve más exigente cuanto más estrellas tiene el destino
function ajustesAterrizaje(d) {
  const n = Math.max(1, Math.min(5, d.nivel || 1));
  return {
    mitadBanda: 62 - 4 * n,   // la franja de estabilización mide el doble de esto
    corredor: 56 - 5 * n,     // qué tan ancha es la senda de descenso
    zonaLargo: 460 - 40 * n,  // largo de la zona de toque
    toqueMax: 2.0 - 0.15 * n, // velocidad de caída máxima para un toque suave
  };
}

function estadoInicial() {
  return {
    estado: "instrucciones", // instrucciones → despegando → jugando → aterrizando → completado
                             // (perdiste y aterrizajeFallido son los dos tipos de fallo)
    y: Y_PISTA,
    vel: 0,
    obstaculos: [],
    distancia: 0,
    generados: 0,        // cuántos obstáculos aparecieron en este vuelo
    recorrido: 0,        // cuánto avanzó en vuelo (mueve el fondo del país)
    millas: 0,
    record: 0,
    velocidadDespegue: 0,
    altitud: 0,          // 0 = en pista, 1 = altura de vuelo
    fase: "aceleracion", // aceleracion → ascenso
    recorridoDespegue: 0,
    pista: 0,            // cuánto se desplazó el aeropuerto
    nube: 0,
    transicion: 1,       // 0 = recién despegó, 1 = aeropuerto ya desapareció
    tPerdio: 0,
    ultimoArriba: null,  // altura del último obstáculo (para que el siguiente no quede imposible)
    rafagaTiempo: 0,     // cuánto le queda a la ráfaga actual
    rafagaFuerza: 0,     // hacia dónde empuja (negativo = arriba, positivo = abajo)
    proximaRafaga: 120,  // cuánto falta para la siguiente ráfaga
    avisoLevanta: 0,     // ms que le quedan al cartel grande ¡LEVANTÁ!
    // Aterrizaje
    faseAt: "estabilizar", // estabilizar → descenso → rodaje
    estabilizacion: 0,     // 0 a 1
    transAt: 0,            // 0 = recién llegó, 1 = el aeropuerto ya se ve completo
    pistaX: PISTA_ARRANQUE, // dónde está el inicio de la pista en pantalla
    y0: 0,                 // altura a la que empezó el descenso
    tDesc: 0,              // frames que lleva el descenso
    tRodaje: 0,            // ms que lleva frenando
    suavidad: 0,           // qué suave fue el toque (0 a 1)
    motivo: "",            // por qué falló el aterrizaje
  };
}

const modulo = (v, d) => ((v % d) + d) % d;
const suave = (t) => t * t * (3 - 2 * t);
const limitar = (v, min, max) => Math.max(min, Math.min(max, v));

// "esperando" es true mientras se ve el cartel de instrucciones (briefing).
// Cuando pasa a false, el avión empieza el despegue.
// "ciudad" y "aeropuerto" se usan en el aterrizaje (por ejemplo "Río de Janeiro" y "SDU").
export default function Juego({
  meta = 100,
  fondo = null,
  dificultad = null,
  esperando = false,
  ciudad = "",
  aeropuerto = "",
  onNivelCompleto,
}) {
  const canvasRef = useRef(null);
  const juego = useRef(null);
  const apretando = useRef(false);
  const metaRef = useRef(meta);
  const alCompletarRef = useRef(onNivelCompleto);
  const dificultadRef = useRef(DIFICULTAD_BASE);
  const ciudadRef = useRef(ciudad);
  const aeropuertoRef = useRef(aeropuerto);
  metaRef.current = meta;
  alCompletarRef.current = onNivelCompleto;
  ciudadRef.current = ciudad;
  aeropuertoRef.current = aeropuerto;
  // Mezcla la dificultad base con la del país (lo que falte queda con el valor base)
  dificultadRef.current = { ...DIFICULTAD_BASE, ...(dificultad || {}) };

  if (!juego.current) juego.current = estadoInicial();

  // Cuando se cierra el cartel de instrucciones, empieza el despegue
  useEffect(() => {
    const j = juego.current;
    if (!esperando && j.estado === "instrucciones") {
      j.estado = "despegando";
    }
  }, [esperando]);

  // Después de chocar: vuelve todo al principio y hay que despegar de nuevo.
  // Se conserva el récord y el movimiento de las nubes.
  // (Object.assign cambia los valores del mismo objeto, no crea uno nuevo.)
  function reintentar() {
    const j = juego.current;
    const record = j.record;
    const nube = j.nube;

    Object.assign(j, estadoInicial(), { record, nube, estado: "despegando" });
  }

  // Después de un aterrizaje fallido: "motor y al aire".
  // Se repite solo la aproximación; las millas ya están logradas.
  function reintentarAterrizaje() {
    const j = juego.current;
    j.estado = "aterrizando";
    j.faseAt = "estabilizar";
    j.y = Y_VUELO;
    j.vel = 0;
    j.estabilizacion = 0;
    j.transAt = 1;
    j.pistaX = PISTA_ARRANQUE;
    j.rafagaTiempo = 0;
    j.proximaRafaga = 120;
  }

  // Un solo "apretar" para todo: espacio, flecha ↑, clic o dedo
  function presionar() {
    const j = juego.current;
    apretando.current = true;

    switch (j.estado) {
      case "jugando":
        j.vel = SALTO;
        break;
      case "perdiste":
        if (performance.now() - j.tPerdio > 600) reintentar();
        break;
      case "aterrizajeFallido":
        if (performance.now() - j.tPerdio > 600) reintentarAterrizaje();
        break;
      default:
        // En "instrucciones" no pasa nada: el despegue empieza desde el cartel.
        // Al despegar y al aterrizar el avión se controla manteniendo apretado.
        break;
    }
  }

  function soltar() {
    apretando.current = false;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dibujamos al doble de resolución en pantallas retina para que no se vea borroso
    const nitidez = Math.min(window.devicePixelRatio || 1, NITIDEZ_MAX);
    canvas.width = ANCHO * nitidez;
    canvas.height = ALTO * nitidez;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(nitidez, 0, 0, nitidez, 0, 0);
    const j = juego.current;

    let frame;
    let anterior = performance.now();
    let activo = true;

    const imagenAvion = new Image();
    imagenAvion.src = IMAGEN_AVION;

    let imagenFondo = null;
    if (fondo) {
      const f = new Image();
      f.onload = () => {
        imagenFondo = f;
      };
      f.src = fondo;
    }

    // ---------- UTILIDADES ----------
    function rect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    }

    function redondeado(x, y, w, h, r, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    }

    function circulo(x, y, r, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function texto(t, x, y, tam = 20, color = "#fff", peso = "bold", alinear = "center") {
      ctx.fillStyle = color;
      ctx.font = `${peso} ${tam}px ${FUENTE}`;
      ctx.textAlign = alinear;
      ctx.fillText(t, x, y);
    }

    // Panel azul con borde clarito: la base de todos los carteles del HUD
    function panel(x, y, w, h) {
      redondeado(x, y, w, h, 14, "rgba(27,0,136,0.92)");
      ctx.strokeStyle = "rgba(201,208,255,0.28)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 14);
      ctx.stroke();
    }

    // ---------- CIELO (atardecer, igual al de brasil.svg) ----------
    function dibujarCielo() {
      const g = ctx.createLinearGradient(0, 0, 0, ALTO);
      g.addColorStop(0, AZUL);
      g.addColorStop(0.45, CELESTE);
      g.addColorStop(0.8, "#7ec8f2");
      g.addColorStop(1, "#ffd9b0");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, ANCHO, ALTO);

      circulo(300, 430, 100, "rgba(255,207,107,0.25)");
      circulo(300, 430, 62, "#ffcf6b");

      for (let i = 0; i < 8; i++) {
        const x = modulo(i * 173 - j.nube * 0.025, ANCHO + 240) - 120;
        const y = 65 + (i % 4) * 46;
        const escala = 0.65 + (i % 3) * 0.15;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(escala, escala);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.arc(0, 12, 22, 0, Math.PI * 2);
        ctx.arc(24, 0, 29, 0, Math.PI * 2);
        ctx.arc(52, 13, 22, 0, Math.PI * 2);
        ctx.arc(27, 19, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // ---------- CIUDAD + AEROPUERTO ----------
    function dibujarEdificio(x, base, ancho, alto, tipo, cercano) {
      const colores = cercano
        ? ["#1c2570", "#232d85", "#18205f", "#2a2f8f"]
        : ["#3b4fb5", "#4357bd", "#3548a8", "#4a5fc4"];
      const color = colores[tipo % 4];

      rect(x, base - alto, ancho, alto, color);
      if (tipo % 2 === 1) rect(x + ancho * 0.35, base - alto - 7, ancho * 0.3, 7, color);

      const cols = Math.max(2, Math.floor(ancho / 12));
      const paso = (ancho - 8) / cols;
      ctx.fillStyle = cercano ? "rgba(255,211,107,0.85)" : "rgba(255,211,107,0.35)";

      for (let fila = 0; fila < alto - 14; fila += 17) {
        for (let c = 0; c < cols; c++) {
          // algunas ventanas apagadas para que no se vea repetido
          if ((fila / 17 + c + tipo) % 4 === 0) continue;
          ctx.fillRect(x + 5 + c * paso, base - alto + 10 + fila, 4, 7);
        }
      }
    }

    function dibujarObelisco(x, base, escala) {
      ctx.save();
      ctx.translate(x, base);
      ctx.scale(escala, escala);

      circulo(0, -80, 70, "rgba(255,207,107,0.12)");

      ctx.fillStyle = "#f4efe6";
      ctx.beginPath();
      ctx.moveTo(-13, 0);
      ctx.lineTo(13, 0);
      ctx.lineTo(3, -150);
      ctx.lineTo(-3, -150);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#d9d2c3";
      ctx.beginPath();
      ctx.moveTo(0, -150);
      ctx.lineTo(13, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#f4efe6";
      ctx.beginPath();
      ctx.moveTo(-3, -150);
      ctx.lineTo(3, -150);
      ctx.lineTo(0, -166);
      ctx.closePath();
      ctx.fill();

      rect(-2, -126, 4, 8, "#8cc9ee");
      ctx.restore();
    }

    // Banda de rayas amarillas y negras con un poste y un cartel grande.
    // Marca el punto de la pista donde hay que levantar.
    function dibujarMarcaDespegue() {
      const marcaX = AVION.x + (RECORRIDO_ROTAR - j.pista) * 1.5;
      const ancho = 90;
      if (marcaX - 120 > ANCHO || marcaX + ancho + 120 < 0) return;

      // Rayas sobre la pista
      ctx.save();
      ctx.beginPath();
      ctx.rect(marcaX, 484, ancho, 152);
      ctx.clip();
      rect(marcaX, 484, ancho, 152, "#1b1b1b");
      ctx.fillStyle = "#ffd36b";
      for (let i = -6; i < 4; i++) {
        const x0 = marcaX + i * 28;
        ctx.beginPath();
        ctx.moveTo(x0, 636);
        ctx.lineTo(x0 + 14, 636);
        ctx.lineTo(x0 + 14 + 152, 484);
        ctx.lineTo(x0 + 152, 484);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Poste y cartel
      const centro = marcaX + ancho / 2;
      rect(centro - 4, 350, 8, 134, ROJO);
      redondeado(centro - 100, 296, 200, 58, 12, ROJO);
      texto("¡LEVANTÁ!", centro, 336, 28, "#fff", "800");
    }

    // Todo lo que está "abajo": ciudad, aeropuerto y pista.
    // Las capas lejanas se mueven más lento que las cercanas (da profundidad).
    function dibujarSuelo({ obelisco = true, marca = true } = {}) {
      const d = j.pista;

      // Edificios lejanos
      for (let i = 0; i < 30; i++) {
        const ancho = 30 + ((i * 17) % 32);
        const alto = 70 + ((i * 31) % 120);
        const x = modulo(i * 73 - d * 0.16, ANCHO + 140) - 70;
        dibujarEdificio(x, 390, ancho, alto, i % 6, false);
      }

      // Obelisco (solo en Buenos Aires)
      if (obelisco) dibujarObelisco(modulo(720 - d * 0.11, ANCHO + 220) - 110, 390, 1.15);

      // Edificios cercanos
      for (let i = 0; i < 16; i++) {
        const ancho = 60 + ((i * 13) % 32);
        const alto = 95 + ((i * 29) % 80);
        const x = modulo(i * 91 - d * 0.32, ANCHO + 180) - 90;
        dibujarEdificio(x, 420, ancho, alto, (i + 2) % 6, true);
      }

      // Árboles
      for (let i = 0; i < 24; i++) {
        const x = modulo(i * 57 - d * 0.58, ANCHO + 100) - 50;
        rect(x - 2, 418, 4, 10, "#6b4a2b");
        circulo(x, 416, 13 + (i % 3) * 2, i % 2 ? "#1f7a3f" : "#2a9150");
      }

      // Plataforma
      rect(0, 420, ANCHO, 30, "#4a5058");

      // Terminales
      for (let i = 0; i < 4; i++) {
        const x = modulo(65 + i * 360 - d * 0.7, ANCHO + 420) - 210;
        rect(x, 342, 270, 78, "#e8ecf2");
        rect(x, 342, 270, 9, CELESTE);
        for (let v = 0; v < 11; v++) rect(x + 10 + v * 23, 361, 16, 36, "#8cc9ee");
        rect(x + 10, 403, 250, 4, "#cfd6e0");
      }

      // Torre de control
      const torreX = modulo(320 - d * 0.82, ANCHO + 180) - 90;
      rect(torreX, 322, 15, 98, "#cfd6e0");
      rect(torreX - 16, 307, 47, 17, CELESTE);
      rect(torreX - 11, 310, 37, 9, "#d6f0f7");
      rect(torreX - 20, 299, 55, 8, ROJO);
      rect(torreX + 6, 285, 2, 14, "#cfd6e0");

      // Hangar
      const hangarX = modulo(600 - d * 0.92, ANCHO + 300) - 150;
      rect(hangarX, 366, 150, 54, "#e8ecf2");
      rect(hangarX, 366, 150, 6, AZUL);
      rect(hangarX + 15, 378, 120, 42, "#cfd6e0");

      // Pasto y pista
      rect(0, 450, ANCHO, 30, "#1f6b45");
      rect(0, 480, ANCHO, 160, "#2b2f33");
      rect(0, 480, ANCHO, 4, "#f4efe6");
      rect(0, 636, ANCHO, 4, "#f4efe6");

      // Rayas centrales
      const paso = 110;
      const desp = modulo(d * 1.5, paso);
      for (let i = -1; i < 12; i++) rect(i * paso - desp, 553, 70, 8, "#ffffff");

      // Luces amarillas a los costados
      const despLuz = modulo(d * 1.5, 52);
      for (let i = -1; i < 22; i++) {
        const x = i * 52 - despLuz;
        circulo(x, 490, 3, "#ffd36b");
        circulo(x, 626, 3, "#ffd36b");
      }

      // Marca de despegue (solo se usa al despegar)
      if (marca) dibujarMarcaDespegue();
    }

    // ---------- AVIÓN ----------
    function dibujarAvion(x, y, rot) {
      if (!imagenAvion.complete || !imagenAvion.naturalWidth) return;
      const w = AVION.w;
      const h = (w * imagenAvion.naturalHeight) / imagenAvion.naturalWidth;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.drawImage(imagenAvion, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    // La sombra se achica y se aclara a medida que el avión sube
    function dibujarSombra() {
      const a = 1 - j.altitud;
      if (a <= 0) return;
      ctx.fillStyle = `rgba(0,0,0,${0.3 * a})`;
      ctx.beginPath();
      ctx.ellipse(AVION.x, 598, 62 * (0.6 + 0.4 * a), 7 * (0.6 + 0.4 * a), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---------- HUD ----------
    // Medidor con barra. "marca" es una rayita blanca opcional: { valor, texto }.
    // "derecha" reemplaza el porcentaje por otro texto.
    function medidor(x, y, titulo, valor, color, marca = null, derecha = null) {
      panel(x, y, 240, 80);
      texto(titulo, x + 18, y + 28, 13, LILA, "bold", "left");
      texto(derecha ?? `${Math.round(valor * 100)}%`, x + 222, y + 28, 17, "#fff", "bold", "right");

      redondeado(x + 18, y + 44, 204, 16, 8, "rgba(255,255,255,0.18)");
      if (valor > 0) redondeado(x + 18, y + 44, Math.max(16, 204 * Math.min(valor, 1)), 16, 8, color);

      if (marca) {
        const mx = x + 18 + 204 * marca.valor;
        rect(mx - 1.5, y + 40, 3, 24, "#fff");
        texto(marca.texto, mx, y + 75, 10, LILA, "bold");
      }
    }

    // Franja horizontal: se pone verde cuando el avión está adentro.
    // La usamos para la altura de vuelo (despegue) y para estabilizar (aterrizaje).
    function dibujarFranja(mitad, dentro, etiqueta) {
      const arriba = Y_VUELO - mitad;
      const alto = mitad * 2;

      rect(0, arriba, ANCHO, alto, dentro ? "rgba(43,214,123,0.30)" : "rgba(255,255,255,0.14)");
      rect(0, arriba - 2, ANCHO, 4, dentro ? VERDE : "rgba(255,255,255,0.9)");
      rect(0, arriba + alto - 2, ANCHO, 4, dentro ? VERDE : "rgba(255,255,255,0.9)");

      const ancho = 280;
      redondeado(ANCHO / 2 - ancho / 2, arriba - 46, ancho, 34, 17, dentro ? VERDE : AZUL);
      texto(dentro ? `✓ ${etiqueta}` : etiqueta, ANCHO / 2, arriba - 23, 15, dentro ? AZUL : "#fff", "bold");
    }

    // Cartel grande que aparece justo cuando el avión levanta
    function dibujarAvisoLevanta() {
      if (j.avisoLevanta <= 0) return;
      ctx.globalAlpha = Math.min(1, j.avisoLevanta / 300);
      redondeado(260, 124, 480, 100, 22, ROJO);
      texto("¡LEVANTÁ!", ANCHO / 2, 196, 56, "#fff", "800");
      ctx.globalAlpha = 1;
    }

    function dibujarHUDDespegue() {
      const acelerando = j.fase === "aceleracion";
      const enBanda = Math.abs(j.y - Y_VUELO) <= BANDA_DESPEGUE;
      const velocidadOk = j.velocidadDespegue >= VEL_MIN;

      // Cartel de la etapa
      panel(20, 20, 470, 84);
      texto(acelerando ? "ETAPA 1 · ACELERÁ" : "ETAPA 2 · ELEVATE", 40, 54, 22, "#fff", "bold", "left");
      texto(
        acelerando ? "Mantené apretado ESPACIO o la pantalla" : "Seguí apretando hasta la franja verde",
        40, 84, 15, LILA, "normal", "left"
      );

      // Medidores
      medidor(740, 20, "VELOCIDAD", j.velocidadDespegue / VEL_MAX, velocidadOk ? VERDE : ROJO, {
        valor: VEL_MIN / VEL_MAX,
        texto: "MÍN",
      });
      medidor(740, 108, "ALTITUD", j.altitud, enBanda ? VERDE : "#7ec8f2");

      // Cuánta pista falta para levantar (solo mientras acelerás)
      if (acelerando) {
        const progreso = Math.min(1, j.recorridoDespegue / RECORRIDO_ROTAR);
        const llegaste = progreso >= 1;
        const faltaVelocidad = llegaste && !velocidadOk;

        panel(20, 114, 470, 56);
        texto("PISTA", 40, 138, 13, LILA, "bold", "left");
        texto(
          faltaVelocidad ? "¡MÁS VELOCIDAD!" : "¡LEVANTÁ!",
          470, 138, 15,
          llegaste && !faltaVelocidad ? VERDE : "#fff",
          "bold", "right"
        );
        redondeado(40, 148, 430, 12, 6, "rgba(255,255,255,0.18)");
        if (progreso > 0) {
          redondeado(40, 148, Math.max(12, 430 * progreso), 12, 6, llegaste && !faltaVelocidad ? VERDE : ROJO);
        }
      }

      dibujarAvisoLevanta();

      // Si soltás, un cartel parpadea para avisarte
      if (!apretando.current && j.avisoLevanta <= 0) {
        const p = (Math.sin(performance.now() / 200) + 1) / 2;
        ctx.globalAlpha = 0.6 + 0.4 * p;
        redondeado(ANCHO / 2 - 170, 180, 340, 50, 25, ROJO);
        texto("MANTENÉ APRETADO", ANCHO / 2, 213, 22);
        ctx.globalAlpha = 1;
      }
    }

    function dibujarHUDVuelo() {
      // Solo queda la meta, a la derecha
      redondeado(790, 20, 190, 58, 12, "rgba(27,0,136,0.9)");
      texto("META", 808, 42, 12, LILA, "bold", "left");
      texto(`${Math.min(j.millas, metaRef.current)} / ${metaRef.current}`, 808, 66, 22, "#fff", "bold", "left");

      // Barra de progreso al medio
      const progreso = Math.min(j.millas / metaRef.current, 1);
      redondeado(300, 44, 400, 10, 5, "rgba(27,0,136,0.45)");
      if (progreso > 0) redondeado(300, 44, Math.max(10, 400 * progreso), 10, 5, ROJO);
    }

    // ---------- DESPEGUE ----------
    function actualizarDespegue(dt) {
      if (j.avisoLevanta > 0) j.avisoLevanta = Math.max(0, j.avisoLevanta - dt);

      if (j.fase === "aceleracion") {
        j.velocidadDespegue = apretando.current
          ? Math.min(VEL_MAX, j.velocidadDespegue + 0.0006 * dt)
          : Math.max(0, j.velocidadDespegue - 0.00015 * dt);

        j.recorridoDespegue += j.velocidadDespegue * dt * 0.8;

        if (j.recorridoDespegue >= RECORRIDO_ROTAR && j.velocidadDespegue >= VEL_MIN) {
          j.fase = "ascenso";
          j.avisoLevanta = AVISO_LEVANTA;
        }
      } else {
        j.velocidadDespegue = Math.min(VEL_MAX, j.velocidadDespegue + 0.00006 * dt);
        j.recorridoDespegue += Math.max(j.velocidadDespegue, VEL_MIN) * dt * 0.8;

        // Si soltás, sigue subiendo muy despacio (no se cae)
        j.altitud = Math.min(1, j.altitud + (apretando.current ? SUBIDA : SUBIDA * 0.12) * dt);

        if (j.altitud >= 1) empezarVuelo();
      }

      j.pista = j.recorridoDespegue;
      j.y = Y_PISTA - j.altitud * (Y_PISTA - Y_VUELO);
    }

    // Acá NO hay pantalla de pausa: el avión ya está en el aire y empieza el juego
    function empezarVuelo() {
      j.estado = "jugando";
      j.y = Y_VUELO;
      j.vel = SALTO * 0.6; // conserva el impulso de la subida
      j.obstaculos = [];
      j.generados = 0;
      j.distancia = dificultadRef.current.separacion; // el primer obstáculo aparece enseguida (tarda ~4 s en llegar)
      j.recorrido = 0;
      j.millas = 0;
      j.transicion = 0;
      j.ultimoArriba = null;
      j.rafagaTiempo = 0;
      j.proximaRafaga = 120; // unos 2 segundos sin ráfagas después de despegar
    }

    function dibujarDespegue() {
      dibujarCielo();
      dibujarSuelo();
      dibujarFranja(BANDA_DESPEGUE, Math.abs(j.y - Y_VUELO) <= BANDA_DESPEGUE, "ALTURA DE VUELO");
      dibujarSombra();

      const angulo = -0.2 * Math.min(1, j.altitud * 4);
      dibujarAvion(AVION.x, j.y, angulo);

      dibujarHUDDespegue();
    }

    // ---------- VUELO ----------
    // Cuántos obstáculos tiene el nivel (10 millas por obstáculo)
    function totalObstaculos() {
      return Math.max(1, Math.ceil(metaRef.current / 10));
    }

    function largoNivel() {
      return (totalObstaculos() - 1) * dificultadRef.current.separacion + (ANCHO - AVION.x + OBS_ANCHO);
    }

    function perder() {
      if (j.estado !== "jugando") return;
      j.estado = "perdiste";
      j.record = Math.max(j.record, j.millas);
      j.tPerdio = performance.now();
    }

    function completar() {
      j.estado = "completado";
      j.record = Math.max(j.record, j.millas);
      if (alCompletarRef.current) alCompletarRef.current(j.millas);
    }

    // Elige a qué altura queda el hueco del próximo obstáculo.
    // El siguiente hueco nunca queda tan lejos del anterior que sea imposible
    // llegar a tiempo (con más velocidad, hay menos tiempo para subir).
    function elegirAltura(d) {
      const minimo = 60;
      const maximo = ALTO - SUELO - d.hueco - 60;
      let desde = minimo;
      let hasta = maximo;

      if (j.ultimoArriba !== null) {
        const framesEntre = d.separacion / d.velocidad; // tiempo entre dos obstáculos
        const desnivel = framesEntre * 2;               // cuánto se puede subir en ese tiempo
        desde = Math.max(minimo, j.ultimoArriba - desnivel);
        hasta = Math.min(maximo, j.ultimoArriba + desnivel);
      }

      const arriba = desde + Math.random() * (hasta - desde);
      j.ultimoArriba = arriba;
      return arriba;
    }

    // Turbulencia: de vez en cuando una ráfaga empuja al avión hacia arriba o abajo
    function aplicarTurbulencia(esc, d) {
      if (d.turbulencia <= 0) return;

      j.proximaRafaga -= esc;
      if (j.proximaRafaga <= 0) {
        j.rafagaTiempo = 25 + Math.random() * 20;
        const signo = Math.random() < 0.5 ? -1 : 1;
        j.rafagaFuerza = signo * d.turbulencia * (0.06 + Math.random() * 0.08);
        j.proximaRafaga = 70 + Math.random() * 110;
      }

      if (j.rafagaTiempo > 0) {
        j.vel += j.rafagaFuerza * esc;
        j.rafagaTiempo -= esc;
      }
    }

    function actualizarVuelo(dt) {
      const d = dificultadRef.current;
      const esc = dt / 16.67;
      const total = totalObstaculos();

      // El aeropuerto se va frenando mientras desaparece
      if (j.transicion < 1) {
        j.transicion = Math.min(1, j.transicion + dt / DURACION_TRANSICION);
        const e = suave(j.transicion);
        const vEscena = j.velocidadDespegue * (1 - e) + 0.24 * e;
        j.pista += vEscena * dt * 0.8;
      }

      aplicarTurbulencia(esc, d);

      j.vel = Math.max(-9, Math.min(j.vel + d.gravedad * esc, MAX_CAIDA));
      j.y += j.vel * esc;

      j.distancia += d.velocidad * esc;
      j.recorrido += d.velocidad * esc;

      // Aparecen solo los obstáculos que hacen falta para llegar a la meta
      if (j.distancia >= d.separacion) {
        j.distancia -= d.separacion;
        if (j.generados < total) {
          j.obstaculos.push({ x: ANCHO, arriba: elegirAltura(d), pasado: false });
          j.generados += 1;
        }
      }

      const mx = 45; // mitad del ancho de la caja de choque
      const my = 15; // mitad del alto

      for (const o of j.obstaculos) {
        o.x -= d.velocidad * esc;

        if (!o.pasado && o.x + OBS_ANCHO < AVION.x) {
          o.pasado = true;
          j.millas += 10;
        }

        const dentroEnX = AVION.x + mx > o.x && AVION.x - mx < o.x + OBS_ANCHO;
        const fueraDelHueco = j.y - my < o.arriba || j.y + my > o.arriba + d.hueco;
        if (dentroEnX && fueraDelHueco) {
          perder();
          return;
        }
      }

      j.obstaculos = j.obstaculos.filter((o) => o.x > -OBS_ANCHO - 10);

      if (j.y - my < 0 || j.y + my > ALTO - SUELO) {
        perder();
        return;
      }

      // Llegaste a la meta: cuando el último obstáculo ya quedó atrás, hay que aterrizar
      if (j.millas >= metaRef.current && j.generados >= total) {
        const libre = j.obstaculos.every((o) => o.x + OBS_ANCHO < AVION.x - mx);
        if (libre) iniciarAterrizaje();
      }
    }

    // El paisaje del país se desplaza según cuánto del nivel recorriste
    function dibujarFondoVuelo() {
      if (imagenFondo) {
        const avance = Math.min(j.recorrido / largoNivel(), 1);
        const escala = imagenFondo.naturalHeight / ALTO;
        const anchoVista = ANCHO * escala;
        const maxX = Math.max(0, imagenFondo.naturalWidth - anchoVista);
        ctx.drawImage(
          imagenFondo,
          maxX * avance, 0, anchoVista, imagenFondo.naturalHeight,
          0, 0, ANCHO, ALTO
        );
      } else {
        dibujarCielo();
      }
    }

    function dibujarObstaculos() {
      const d = dificultadRef.current;

      for (const o of j.obstaculos) {
        const inferior = o.arriba + d.hueco;
        const altoInferior = ALTO - SUELO - inferior;

        // columnas
        rect(o.x, 0, OBS_ANCHO, o.arriba, AZUL);
        rect(o.x, inferior, OBS_ANCHO, altoInferior, AZUL);

        // brillo del costado
        rect(o.x + 8, 0, 6, o.arriba, "rgba(255,255,255,0.18)");
        rect(o.x + 8, inferior, 6, altoInferior, "rgba(255,255,255,0.18)");

        // tapas rojas
        redondeado(o.x - 6, o.arriba - 18, OBS_ANCHO + 12, 18, 6, ROJO);
        redondeado(o.x - 6, inferior, OBS_ANCHO + 12, 18, 6, ROJO);
      }
    }

    // Niebla: tapa la parte derecha de la pantalla, así los obstáculos (y la pista)
    // se ven recién cuando ya están cerca del avión
    function dibujarNiebla() {
      const d = dificultadRef.current;
      if (d.niebla <= 0) return;

      const g = ctx.createLinearGradient(ANCHO * 0.3, 0, ANCHO * 0.8, 0);
      g.addColorStop(0, "rgba(226,236,248,0)");
      g.addColorStop(1, `rgba(226,236,248,${d.niebla})`);
      ctx.fillStyle = g;
      ctx.fillRect(ANCHO * 0.3, 0, ANCHO * 0.7, ALTO);
    }

    // Mientras sopla una ráfaga: rayitas de viento y un cartel de aviso
    function dibujarRafaga() {
      if (j.rafagaTiempo <= 0) return;

      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      for (let i = 0; i < 9; i++) {
        const x = modulo(i * 131 - j.nube * 0.6, ANCHO + 200) - 100;
        const y = 110 + ((i * 97) % (ALTO - 260));
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 70, y + (j.rafagaFuerza < 0 ? -10 : 10)); // inclinadas hacia donde empuja
        ctx.stroke();
      }
      ctx.lineCap = "butt";

      redondeado(ANCHO / 2 - 90, 70, 180, 26, 13, ROJO);
      texto("¡TURBULENCIA!", ANCHO / 2, 88, 12, "#fff", "800");
    }

    function dibujarVuelo() {
      dibujarFondoVuelo();

      // El aeropuerto cae y se desvanece mientras aparece el paisaje del país
      const e = suave(j.transicion);
      if (e < 1) {
        ctx.save();
        ctx.globalAlpha = 1 - e;
        dibujarCielo();
        ctx.translate(0, e * 200);
        dibujarSuelo();
        ctx.restore();
      }

      dibujarObstaculos();

      // Si no hay imagen del país, dibujamos un suelo simple
      if (!imagenFondo) {
        rect(0, ALTO - SUELO, ANCHO, SUELO, AZUL);
        rect(0, ALTO - SUELO, ANCHO, 5, ROJO);
      }

      dibujarNiebla();
      dibujarRafaga();

      // Durante una ráfaga el avión tiembla un poquito
      const temblor = j.rafagaTiempo > 0 ? Math.sin(j.nube * 0.06) * 0.05 : 0;
      const rot = Math.max(-0.4, Math.min(0.6, j.vel * 0.05)) + temblor;
      dibujarAvion(AVION.x, j.y, rot);

      if (MOSTRAR_CAJA) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(AVION.x - 45, j.y - 15, 90, 30);
      }

      dibujarHUDVuelo();
    }

    // ---------- ATERRIZAJE ----------
    // Etapa 1 · ESTABILIZÁ: mantené el avión en la franja verde hasta llenar el medidor.
    // Etapa 2 · DESCENDÉ: seguí la senda y tocá la zona verde de la pista con un toque suave.
    // Después el avión frena solo en la pista y se completa el nivel.
    // Control: mantener apretado = sube, soltar = baja.

    function iniciarAterrizaje() {
      j.estado = "aterrizando";
      j.faseAt = "estabilizar";
      j.estabilizacion = 0;
      j.transAt = 0;
      j.pistaX = PISTA_ARRANQUE;
      j.y = Math.min(j.y, Y_TOQUE - 80); // no empezar pegado al suelo
      j.rafagaTiempo = 0;
      j.proximaRafaga = 120;
    }

    function empezarDescenso() {
      j.faseAt = "descenso";
      j.y0 = j.y;
      j.tDesc = 0;
      j.pistaX = PISTA_ARRANQUE;
    }

    function fallarAterrizaje(motivo) {
      j.estado = "aterrizajeFallido";
      j.motivo = motivo;
      j.tPerdio = performance.now();
    }

    function aterrizarBien(a) {
      j.faseAt = "rodaje";
      j.suavidad = limitar(1 - Math.max(0, j.vel) / a.toqueMax, 0, 1);
      j.y = Y_TOQUE;
      j.vel = 0;
      j.altitud = 0;
      j.tRodaje = 0;
    }

    function actualizarAterrizaje(dt) {
      const d = dificultadRef.current;
      const a = ajustesAterrizaje(d);
      const esc = dt / 16.67;

      // El aeropuerto aparece poco a poco
      j.transAt = Math.min(1, j.transAt + dt / DURACION_TRANSICION);

      // Los últimos obstáculos se van de la pantalla
      for (const o of j.obstaculos) o.x -= d.velocidad * esc;
      j.obstaculos = j.obstaculos.filter((o) => o.x > -OBS_ANCHO - 10);

      // Rodaje: el avión ya tocó y frena sobre la pista
      if (j.faseAt === "rodaje") {
        j.tRodaje += dt;
        const t = Math.min(1, j.tRodaje / DURACION_RODAJE);
        const v = VEL_SUELO * (1 - suave(t));
        j.pista += (v / 1.5) * esc;
        j.pistaX -= v * esc;

        if (j.tRodaje >= DURACION_RODAJE + 800) completar();
        return;
      }

      // Control: apretado sube, soltado baja (el avión responde suavemente)
      const objetivo = apretando.current ? SUBE_MAX : BAJA_MAX;
      j.vel += (objetivo - j.vel) * SUAVIZADO * esc;
      aplicarTurbulencia(esc, d);
      j.y += j.vel * esc;

      if (j.y < 50) {
        j.y = 50;
        j.vel = Math.max(j.vel, 0);
      }

      j.altitud = limitar((Y_TOQUE - j.y) / (Y_TOQUE - Y_VUELO), 0, 1);

      // El suelo pasa por debajo del avión
      j.pista += (VEL_SUELO / 1.5) * esc;

      // ----- Etapa 1: estabilizar -----
      if (j.faseAt === "estabilizar") {
        const dentro = Math.abs(j.y - Y_VUELO) <= a.mitadBanda;
        const paso = dt / TIEMPO_ESTABILIZAR;

        j.estabilizacion = dentro
          ? Math.min(1, j.estabilizacion + paso)
          : Math.max(0, j.estabilizacion - paso * 1.5);

        if (j.y >= Y_TOQUE) {
          fallarAterrizaje("Bajaste antes de estabilizar la altura");
          return;
        }
        if (j.estabilizacion >= 1) empezarDescenso();
        return;
      }

      // ----- Etapa 2: descenso -----
      j.pistaX -= VEL_SUELO * esc;
      j.tDesc += esc;

      const zonaIni = j.pistaX + ZONA_DESDE;
      const zonaFin = zonaIni + a.zonaLargo;

      if (j.y >= Y_TOQUE) {
        if (AVION.x < j.pistaX) fallarAterrizaje("Tocaste antes de la pista");
        else if (AVION.x < zonaIni) fallarAterrizaje("Tocaste antes de la zona de toque");
        else if (AVION.x > zonaFin) fallarAterrizaje("Te pasaste de la zona de toque");
        else if (j.vel > a.toqueMax) fallarAterrizaje("Toque demasiado brusco");
        else aterrizarBien(a);
        return;
      }

      if (zonaFin < AVION.x) fallarAterrizaje("Te pasaste de la zona de toque");
    }

    // La pista de aterrizaje: pasto a los costados, marcas de inicio y zona de toque verde
    function dibujarPistaAterrizaje(a) {
      const x0 = j.pistaX;
      const x1 = x0 + PISTA_LARGO;

      // Pasto antes y después de la pista (tapa el asfalto que dibuja dibujarSuelo)
      const pasto = "#1f6b45";
      rect(0, 480, limitar(x0, 0, ANCHO), 160, pasto);
      if (x1 < ANCHO) rect(Math.max(0, x1), 480, ANCHO - Math.max(0, x1), 160, pasto);

      // Marcas del inicio de la pista
      if (x0 > -90 && x0 < ANCHO) {
        rect(x0, 484, 6, 152, "#ffffff");
        for (let i = 0; i < 8; i++) rect(x0 + 16, 492 + i * 18, 64, 10, "#ffffff");
      }

      // Zona de toque
      const zi = x0 + ZONA_DESDE;
      const zf = zi + a.zonaLargo;
      if (zf > 0 && zi < ANCHO) {
        const encima = AVION.x >= zi && AVION.x <= zf;
        rect(zi, 484, a.zonaLargo, 152, encima ? "rgba(43,214,123,0.55)" : "rgba(43,214,123,0.32)");
        rect(zi, 484, 5, 152, VERDE);
        rect(zf - 5, 484, 5, 152, VERDE);

        const centro = zi + a.zonaLargo / 2;
        rect(centro - 45, 506, 90, 12, "#ffffff");
        rect(centro - 45, 604, 90, 12, "#ffffff");

        const etiqueta = aeropuertoRef.current ? `ZONA DE TOQUE · ${aeropuertoRef.current}` : "ZONA DE TOQUE";
        redondeado(centro - 120, 436, 240, 32, 16, VERDE);
        texto(etiqueta, centro, 458, 14, AZUL, "bold");
      }
    }

    // La senda de descenso: una franja diagonal desde donde empezaste hasta la zona de toque
    function dibujarSenda(a) {
      const ax = AVION.x - VEL_SUELO * j.tDesc;
      const ay = j.y0;
      const bx = j.pistaX + ZONA_DESDE + a.zonaLargo / 2;
      const by = Y_TOQUE;

      const t = (AVION.x - ax) / (bx - ax);
      const yLinea = ay + (by - ay) * t;
      const dentro = Math.abs(j.y - yLinea) <= a.corredor;
      const color = dentro ? VERDE : "#ffb020";

      ctx.fillStyle = dentro ? "rgba(43,214,123,0.28)" : "rgba(255,176,32,0.22)";
      ctx.beginPath();
      ctx.moveTo(ax, ay - a.corredor);
      ctx.lineTo(bx, by - a.corredor);
      ctx.lineTo(bx, by + a.corredor);
      ctx.lineTo(ax, ay + a.corredor);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.setLineDash([14, 10]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.restore();
    }

    function dibujarHUDAterrizaje(a) {
      // Ya tocó: cartel verde mientras frena
      if (j.faseAt === "rodaje") {
        redondeado(260, 150, 480, 118, 22, VERDE);
        texto("¡ATERRIZASTE!", ANCHO / 2, 212, 48, AZUL, "800");
        texto(j.suavidad > 0.5 ? "Toque suave" : "Toque firme pero seguro", ANCHO / 2, 246, 18, AZUL, "bold");
        return;
      }

      const estabilizando = j.faseAt === "estabilizar";

      // Cartel de la etapa
      panel(20, 20, 470, 108);
      texto(estabilizando ? "ETAPA 1 · ESTABILIZÁ" : "ETAPA 2 · DESCENDÉ", 40, 54, 22, "#fff", "bold", "left");
      texto(
        estabilizando ? "Mantené el avión en la franja verde" : "Seguí la senda y tocá la zona verde",
        40, 80, 15, LILA, "normal", "left"
      );
      texto(
        estabilizando ? "Apretá para subir · soltá para bajar" : "Apretá para frenar la caída · soltá para bajar",
        40, 104, 15, "#fff", "bold", "left"
      );

      if (estabilizando) {
        const dentro = Math.abs(j.y - Y_VUELO) <= a.mitadBanda;
        medidor(740, 20, "ESTABILIZACIÓN", j.estabilizacion, dentro ? VERDE : ROJO);
        medidor(740, 108, "ALTITUD", j.altitud, dentro ? VERDE : "#7ec8f2");
      } else {
        const suaveOk = j.vel <= a.toqueMax;
        medidor(
          740, 20, "DESCENSO",
          limitar(Math.max(j.vel, 0) / BAJA_MAX, 0, 1),
          suaveOk ? VERDE : ROJO,
          { valor: a.toqueMax / BAJA_MAX, texto: "MÁX" },
          suaveOk ? "SUAVE" : "MUY RÁPIDO"
        );
        medidor(740, 108, "ALTITUD", j.altitud, "#7ec8f2");
      }
    }

    function dibujarAterrizaje() {
      const d = dificultadRef.current;
      const a = ajustesAterrizaje(d);
      const e = suave(j.transAt);

      dibujarFondoVuelo();

      // El aeropuerto aparece desde abajo mientras se desvanece el paisaje del país
      ctx.save();
      ctx.globalAlpha = e;
      dibujarCielo();
      ctx.translate(0, (1 - e) * 200);
      dibujarSuelo({ obelisco: ciudadRef.current === "Buenos Aires", marca: false });
      dibujarPistaAterrizaje(a);
      ctx.restore();

      dibujarObstaculos();

      if (j.faseAt === "estabilizar") {
        dibujarFranja(a.mitadBanda, Math.abs(j.y - Y_VUELO) <= a.mitadBanda, "ALTURA DE APROXIMACIÓN");
      } else {
        if (j.faseAt === "descenso") dibujarSenda(a);
        dibujarSombra();
      }

      dibujarNiebla();
      dibujarRafaga();

      // El avión baja la nariz al descender y se nivela al tocar
      let rot = 0;
      if (j.faseAt !== "rodaje") {
        const temblor = j.rafagaTiempo > 0 ? Math.sin(j.nube * 0.06) * 0.05 : 0;
        rot = limitar(j.vel * 0.06, -0.25, 0.3) + temblor;
      }
      dibujarAvion(AVION.x, j.y, rot);

      dibujarHUDAterrizaje(a);
    }

    // ---------- CARTELES DE FALLO ----------
    function cartelCanvas(titulo, lineas, textoBoton) {
      rect(0, 0, ANCHO, ALTO, "rgba(16,20,21,0.7)");
      redondeado(280, 175, 440, 290, 24, AZUL);

      texto(titulo, ANCHO / 2, 235, 26);
      lineas.forEach((l, i) => texto(l.t, ANCHO / 2, 283 + i * 32, l.tam, LILA, "normal"));

      redondeado(345, 350, 310, 52, 26, ROJO);
      texto(textoBoton, ANCHO / 2, 383, 17);
    }

    // ---------- DIBUJO Y BUCLE ----------
    function dibujar() {
      ctx.clearRect(0, 0, ANCHO, ALTO);

      if (j.estado === "instrucciones") {
        // El cartel de instrucciones es HTML (briefing.jsx) y se ve por encima:
        // acá solo dibujamos el aeropuerto de fondo
        dibujarCielo();
        dibujarSuelo();
        return;
      }

      if (j.estado === "despegando") {
        dibujarDespegue();
        return;
      }

      if (j.estado === "aterrizando" || j.estado === "aterrizajeFallido" || j.estado === "completado") {
        dibujarAterrizaje();

        if (j.estado === "aterrizajeFallido") {
          cartelCanvas(
            "ATERRIZAJE FALLIDO",
            [
              { t: j.motivo, tam: 18 },
              { t: "Probá de nuevo desde la aproximación", tam: 15 },
            ],
            "MOTOR Y AL AIRE"
          );
        }
        // Al completar, Jugar.jsx muestra su propia tarjeta con confeti
        if (j.estado === "completado") rect(0, 0, ANCHO, ALTO, "rgba(16,20,21,0.35)");
        return;
      }

      dibujarVuelo();

      if (j.estado === "perdiste") {
        cartelCanvas(
          "VUELO INTERRUMPIDO",
          [
            { t: `Millas recorridas: ${j.millas}`, tam: 18 },
            { t: `Récord: ${j.record} millas`, tam: 15 },
          ],
          "VOLVER A DESPEGAR"
        );
      }
    }

    function bucle(ahora) {
      if (!activo) return;

      const dt = Math.min(ahora - anterior, 40);
      anterior = ahora;

      j.nube += dt;

      if (j.estado === "despegando") actualizarDespegue(dt);
      else if (j.estado === "jugando") actualizarVuelo(dt);
      else if (j.estado === "aterrizando") actualizarAterrizaje(dt);

      dibujar();
      frame = requestAnimationFrame(bucle);
    }

    // ---------- TECLADO ----------
    function teclaPresionada(e) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!e.repeat) presionar();
      }
    }

    function teclaSoltada(e) {
      if (e.code === "Space" || e.code === "ArrowUp") soltar();
    }

    window.addEventListener("keydown", teclaPresionada);
    window.addEventListener("keyup", teclaSoltada);
    window.addEventListener("blur", soltar);

    frame = requestAnimationFrame(bucle);

    return () => {
      activo = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", teclaPresionada);
      window.removeEventListener("keyup", teclaSoltada);
      window.removeEventListener("blur", soltar);
    };
  }, [fondo]);

  // ---------- MOUSE Y DEDO ----------
  function alApretar(e) {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // no pasa nada si el navegador no lo permite
    }
    presionar();
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: `${ANCHO}px`,
        margin: "0 auto",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        width={ANCHO}
        height={ALTO}
        onPointerDown={alApretar}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          borderRadius: "12px",
          cursor: "pointer",
          touchAction: "none",
        }}
      />

      <div style={{ textAlign: "center", fontSize: "12px", opacity: 0.65, marginTop: "8px" }}>
        Despegue: mantené apretado · Vuelo: tocá para subir · Aterrizaje: mantené para subir, soltá para bajar
      </div>
    </div>
  );
}