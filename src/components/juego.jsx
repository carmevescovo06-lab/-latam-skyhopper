import { useEffect, useRef } from "react";

// ===== AJUSTES: números que podés cambiar =====
const ANCHO = 1000;
const ALTO = 640;
const SUELO = 40;
const NITIDEZ_MAX = 2;

// Vuelo
const SALTO = -6.4;
const MAX_CAIDA = 8.5;
const OBS_ANCHO = 64;
const MOSTRAR_CAJA = false;

const DIFICULTAD_BASE = {
  nivel: 1,
  desafio: "Cielo despejado",
  velocidad: 3.2,
  hueco: 210,
  separacion: 330,
  gravedad: 0.34,
  turbulencia: 0,
  niebla: 0,
};

const AVION = { x: 175, w: 160 };
const IMAGEN_AVION = "/imagenes/avion-latam.svg";

// Despegue
const Y_PISTA = 555;
const Y_VUELO = 330;
const VEL_MIN = 0.45;
const VEL_MAX = 1.4;
const RECORRIDO_ROTAR = 1200;
const SUBIDA = 0.0003;
const BANDA_DESPEGUE = 40;
const AVISO_LEVANTA = 1400;

// Aterrizaje
const VEL_SUELO = 4.2;
const PISTA_ARRANQUE = ANCHO + 120;
const ZONA_DESDE = 420;
const Y_TOQUE = Y_PISTA;
const TIEMPO_ESTABILIZAR = 2400;
const SUBE_MAX = -1.9;
const BAJA_MAX = 2.4;
const SUAVIZADO = 0.08;
const DURACION_RODAJE = 2200;

// Fondo largo
const ESCALA_DESPEGUE = 1.5; // cuánto se mueve el fondo por cada unidad de pista recorrida
// CAMBIO: velocidad mínima del fondo en el aire (px por milisegundo). 0.09 = 1,5 px por frame.
const VEL_FONDO_CRUCERO = 0.09;
// CAMBIO: milisegundos que tarda el fondo en bajar de la velocidad de pista a la de crucero
const TAU_ASCENSO = 900;
const PISTA_Y = 484;
const PISTA_ALTO = 152;
// CAMBIO: la zona de aterrizaje queda a esta distancia del final de la imagen
const PISTA_DESDE_EL_FINAL = 2300;
// CAMBIO: al empezar la aproximación, la pista está a esta distancia
const PISTA_ANTES_APROX = 1250;
// CAMBIO: cuánto avanza el fondo en el rodaje (para arrancar a la misma velocidad del descenso)
const DIST_RODAJE = ((VEL_SUELO / 16.67) * DURACION_RODAJE) / 2;
const ANCHO_SIN_IMAGEN = 9000;

// Identidad SkyHopper
const AZUL = "#1B0088";
const ROJO = "#EB0045";
const CELESTE = "#007CE0";
const LILA = "#c9d0ff";
const VERDE = "#2BD67B";
const FUENTE = "Sora, Arial, sans-serif";

// Aterrizaje más permisivo
function ajustesAterrizaje(d) {
  const n = Math.max(1, Math.min(5, d.nivel || 1));

  return {
    mitadBanda: 88 - 3 * n,
    corredor: 88 - 3 * n,
    zonaLargo: 650 - 20 * n,
    toqueMax: 3.4 - 0.1 * n,
  };
}

function estadoInicial() {
  return {
    estado: "instrucciones",
    y: Y_PISTA,
    vel: 0,
    obstaculos: [],
    distancia: 0,
    generados: 0,
    recorrido: 0,
    millas: 0,
    record: 0,
    velocidadDespegue: 0,
    altitud: 0,
    fase: "aceleracion",
    recorridoDespegue: 0,
    scroll: 0,
    scrollVuelo0: 0,
    reiniciarScroll: false,
    velFondoAsc: 0, // CAMBIO: velocidad del fondo en el momento de levantar
    tAscenso: 0, // CAMBIO: tiempo transcurrido desde que se levantó
    nube: 0,
    tPerdio: 0,
    ultimoArriba: null,
    rafagaTiempo: 0,
    rafagaFuerza: 0,
    proximaRafaga: 120,
    avisoLevanta: 0,

    // Aterrizaje
    faseAt: "estabilizar",
    estabilizacion: 0,
    pistaX: PISTA_ARRANQUE,
    y0: 0,
    tDesc: 0,
    tRodaje: 0,
    scrollRodaje0: 0,
    scrollRodajeFin: 0, // CAMBIO: hasta dónde llega el fondo en el rodaje
    suavidad: 0,
    motivo: "",
  };
}

const modulo = (v, d) => ((v % d) + d) % d;
const limitar = (v, min, max) => Math.max(min, Math.min(max, v));

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
  dificultadRef.current = { ...DIFICULTAD_BASE, ...(dificultad || {}) };

  if (!juego.current) juego.current = estadoInicial();

  useEffect(() => {
    const j = juego.current;

    if (!esperando && j.estado === "instrucciones") {
      j.estado = "despegando";
    }
  }, [esperando]);

  function reintentar() {
    const j = juego.current;
    const record = j.record;
    const nube = j.nube;

    Object.assign(j, estadoInicial(), {
      record,
      nube,
      estado: "despegando",
    });
  }

  function reintentarAterrizaje() {
    const j = juego.current;

    j.estado = "aterrizando";
    j.faseAt = "estabilizar";
    j.y = Y_VUELO;
    j.vel = 0;
    j.estabilizacion = 0;
    j.reiniciarScroll = true;
    j.rafagaTiempo = 0;
    j.proximaRafaga = 120;
  }

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
        break;
    }
  }

  function soltar() {
    apretando.current = false;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

    function texto(
      t,
      x,
      y,
      tam = 20,
      color = "#fff",
      peso = "bold",
      alinear = "center"
    ) {
      ctx.fillStyle = color;
      ctx.font = `${peso} ${tam}px ${FUENTE}`;
      ctx.textAlign = alinear;
      ctx.fillText(t, x, y);
    }

    function panel(x, y, w, h) {
      redondeado(x, y, w, h, 14, "rgba(27,0,136,0.92)");

      ctx.strokeStyle = "rgba(201,208,255,0.28)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 14);
      ctx.stroke();
    }

    // ---------- CIELO ----------

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

    // ---------- FONDO LARGO ----------

    function medidasFondo() {
      if (!imagenFondo) {
        return {
          anchoImg: ANCHO_SIN_IMAGEN,
          maxScroll: ANCHO_SIN_IMAGEN - ANCHO,
        };
      }

      const anchoImg =
        (imagenFondo.naturalWidth * ALTO) / imagenFondo.naturalHeight;

      return {
        anchoImg,
        maxScroll: Math.max(0, anchoImg - ANCHO),
      };
    }

    // CAMBIO: la pista de aterrizaje se ubica contando desde el FINAL de la imagen.
    // Así, si cambiás el largo de la foto, la pista se acomoda sola.
    function pistaImgX() {
      return medidasFondo().anchoImg - PISTA_DESDE_EL_FINAL;
    }

    // CAMBIO: posición del fondo en la que empieza la aproximación
    function scrollAproximacion() {
      return limitar(
        pistaImgX() - PISTA_ANTES_APROX,
        0,
        medidasFondo().maxScroll
      );
    }

    function dibujarFondo(scroll, conPista = false) {
      if (!imagenFondo) {
        dibujarCielo();

        if (conPista) {
          rect(0, PISTA_Y, ANCHO, PISTA_ALTO, "#2b2f33");
        }

        return;
      }

      const m = medidasFondo();
      const k = imagenFondo.naturalHeight / ALTO;
      const x = limitar(scroll, 0, m.maxScroll);

      ctx.drawImage(
        imagenFondo,
        x * k,
        0,
        ANCHO * k,
        imagenFondo.naturalHeight,
        0,
        0,
        ANCHO,
        ALTO
      );
    }

    function dibujarMarcaDespegue() {
      // CAMBIO: la marca se mueve junto con el fondo (usa j.scroll),
      // así nunca se desfasa de la imagen.
      const marcaX =
        AVION.x + (RECORRIDO_ROTAR * ESCALA_DESPEGUE - j.scroll);

      const ancho = 90;

      if (marcaX - 120 > ANCHO || marcaX + ancho + 120 < 0) return;

      const arriba = PISTA_Y;
      const abajo = PISTA_Y + PISTA_ALTO;

      ctx.save();
      ctx.beginPath();
      ctx.rect(marcaX, arriba, ancho, PISTA_ALTO);
      ctx.clip();

      rect(marcaX, arriba, ancho, PISTA_ALTO, "#1b1b1b");

      ctx.fillStyle = "#ffd36b";

      for (let i = -6; i < 4; i++) {
        const x0 = marcaX + i * 28;

        ctx.beginPath();
        ctx.moveTo(x0, abajo);
        ctx.lineTo(x0 + 14, abajo);
        ctx.lineTo(x0 + 14 + PISTA_ALTO, arriba);
        ctx.lineTo(x0 + PISTA_ALTO, arriba);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      const centro = marcaX + ancho / 2;

      rect(centro - 4, arriba - 134, 8, 134, ROJO);
      redondeado(centro - 100, arriba - 188, 200, 58, 12, ROJO);

      texto("¡LEVANTÁ!", centro, arriba - 148, 28, "#fff", "800");
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

    function dibujarSombra() {
      const a = 1 - j.altitud;

      if (a <= 0) return;

      ctx.fillStyle = `rgba(0,0,0,${0.3 * a})`;
      ctx.beginPath();

      ctx.ellipse(
        AVION.x,
        Y_PISTA + 43,
        62 * (0.6 + 0.4 * a),
        7 * (0.6 + 0.4 * a),
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }

    // ---------- HUD ----------

    function medidor(
      x,
      y,
      titulo,
      valor,
      color,
      marca = null,
      derecha = null
    ) {
      panel(x, y, 240, 80);

      texto(titulo, x + 18, y + 28, 13, LILA, "bold", "left");

      texto(
        derecha ?? `${Math.round(valor * 100)}%`,
        x + 222,
        y + 28,
        17,
        "#fff",
        "bold",
        "right"
      );

      redondeado(
        x + 18,
        y + 44,
        204,
        16,
        8,
        "rgba(255,255,255,0.18)"
      );

      if (valor > 0) {
        redondeado(
          x + 18,
          y + 44,
          Math.max(16, 204 * Math.min(valor, 1)),
          16,
          8,
          color
        );
      }

      if (marca) {
        const mx = x + 18 + 204 * marca.valor;

        rect(mx - 1.5, y + 40, 3, 24, "#fff");
        texto(marca.texto, mx, y + 75, 10, LILA, "bold");
      }
    }

    function dibujarFranja(mitad, dentro, etiqueta) {
      const arriba = Y_VUELO - mitad;
      const alto = mitad * 2;

      rect(
        0,
        arriba,
        ANCHO,
        alto,
        dentro ? "rgba(43,214,123,0.30)" : "rgba(255,255,255,0.14)"
      );

      rect(
        0,
        arriba - 2,
        ANCHO,
        4,
        dentro ? VERDE : "rgba(255,255,255,0.9)"
      );

      rect(
        0,
        arriba + alto - 2,
        ANCHO,
        4,
        dentro ? VERDE : "rgba(255,255,255,0.9)"
      );

      const ancho = 280;

      redondeado(
        ANCHO / 2 - ancho / 2,
        arriba - 46,
        ancho,
        34,
        17,
        dentro ? VERDE : AZUL
      );

      texto(
        dentro ? `✓ ${etiqueta}` : etiqueta,
        ANCHO / 2,
        arriba - 23,
        15,
        dentro ? AZUL : "#fff",
        "bold"
      );
    }

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

      panel(20, 20, 470, 84);

      texto(
        acelerando ? "ETAPA 1 · ACELERÁ" : "ETAPA 2 · ELEVATE",
        40,
        54,
        22,
        "#fff",
        "bold",
        "left"
      );

      texto(
        acelerando
          ? "Mantené apretado ESPACIO o la pantalla"
          : "Seguí apretando hasta la franja verde",
        40,
        84,
        15,
        LILA,
        "normal",
        "left"
      );

      medidor(
        740,
        20,
        "VELOCIDAD",
        j.velocidadDespegue / VEL_MAX,
        velocidadOk ? VERDE : ROJO,
        {
          valor: VEL_MIN / VEL_MAX,
          texto: "MÍN",
        }
      );

      medidor(
        740,
        108,
        "ALTITUD",
        j.altitud,
        enBanda ? VERDE : "#7ec8f2"
      );

      if (acelerando) {
        const progreso = Math.min(
          1,
          j.recorridoDespegue / RECORRIDO_ROTAR
        );

        const llegaste = progreso >= 1;
        const faltaVelocidad = llegaste && !velocidadOk;

        panel(20, 114, 470, 56);

        texto("PISTA", 40, 138, 13, LILA, "bold", "left");

        texto(
          faltaVelocidad ? "¡MÁS VELOCIDAD!" : "¡LEVANTÁ!",
          470,
          138,
          15,
          llegaste && !faltaVelocidad ? VERDE : "#fff",
          "bold",
          "right"
        );

        redondeado(
          40,
          148,
          430,
          12,
          6,
          "rgba(255,255,255,0.18)"
        );

        if (progreso > 0) {
          redondeado(
            40,
            148,
            Math.max(12, 430 * progreso),
            12,
            6,
            llegaste && !faltaVelocidad ? VERDE : ROJO
          );
        }
      }

      dibujarAvisoLevanta();

      if (!apretando.current && j.avisoLevanta <= 0) {
        const p = (Math.sin(performance.now() / 200) + 1) / 2;

        ctx.globalAlpha = 0.6 + 0.4 * p;

        redondeado(
          ANCHO / 2 - 170,
          180,
          340,
          50,
          25,
          ROJO
        );

        texto("MANTENÉ APRETADO", ANCHO / 2, 213, 22);

        ctx.globalAlpha = 1;
      }
    }

    function dibujarHUDVuelo() {
      redondeado(790, 20, 190, 58, 12, "rgba(27,0,136,0.9)");

      texto("META", 808, 42, 12, LILA, "bold", "left");

      texto(
        `${Math.min(j.millas, metaRef.current)} / ${metaRef.current}`,
        808,
        66,
        22,
        "#fff",
        "bold",
        "left"
      );

      const progreso = Math.min(j.millas / metaRef.current, 1);

      redondeado(
        300,
        44,
        400,
        10,
        5,
        "rgba(27,0,136,0.45)"
      );

      if (progreso > 0) {
        redondeado(
          300,
          44,
          Math.max(10, 400 * progreso),
          10,
          5,
          ROJO
        );
      }
    }

    // ---------- DESPEGUE ----------

    function actualizarDespegue(dt) {
      if (j.avisoLevanta > 0) {
        j.avisoLevanta = Math.max(0, j.avisoLevanta - dt);
      }

      if (j.fase === "aceleracion") {
        j.velocidadDespegue = apretando.current
          ? Math.min(VEL_MAX, j.velocidadDespegue + 0.0006 * dt)
          : Math.max(0, j.velocidadDespegue - 0.00015 * dt);

        j.recorridoDespegue += j.velocidadDespegue * dt * 0.8;

        // CAMBIO: en la carrera el fondo avanza junto con la pista
        j.scroll = j.recorridoDespegue * ESCALA_DESPEGUE;

        if (
          j.recorridoDespegue >= RECORRIDO_ROTAR &&
          j.velocidadDespegue >= VEL_MIN
        ) {
          j.fase = "ascenso";
          j.avisoLevanta = AVISO_LEVANTA;

          // CAMBIO: guardamos con qué velocidad venía el fondo
          // para bajarla de a poco (sin frenazos)
          j.velFondoAsc = j.velocidadDespegue * 0.8 * ESCALA_DESPEGUE;
          j.tAscenso = 0;
        }
      } else {
        j.velocidadDespegue = Math.min(
          VEL_MAX,
          j.velocidadDespegue + 0.00006 * dt
        );

        // CAMBIO: en el ascenso la velocidad del fondo baja suavemente
        // desde la velocidad de pista hasta la de crucero, y ahí se queda.
        // Nunca llega a cero.
        j.tAscenso += dt;

        const velFondo =
          VEL_FONDO_CRUCERO +
          (j.velFondoAsc - VEL_FONDO_CRUCERO) *
            Math.exp(-j.tAscenso / TAU_ASCENSO);

        j.scroll += velFondo * dt;

        j.altitud = Math.min(
          1,
          j.altitud +
            (apretando.current ? SUBIDA : SUBIDA * 0.12) * dt
        );

        if (j.altitud >= 1) empezarVuelo();
      }

      j.y =
        Y_PISTA - j.altitud * (Y_PISTA - Y_VUELO);
    }

    function empezarVuelo() {
      j.estado = "jugando";
      j.y = Y_VUELO;
      j.vel = SALTO * 0.6;
      j.obstaculos = [];
      j.generados = 0;
      j.distancia = dificultadRef.current.separacion;
      j.recorrido = 0;
      j.millas = 0;
      j.scrollVuelo0 = j.scroll;
      j.ultimoArriba = null;
      j.rafagaTiempo = 0;
      j.proximaRafaga = 120;
    }

    function dibujarDespegue() {
      dibujarFondo(j.scroll, true);
      dibujarMarcaDespegue();

      dibujarFranja(
        BANDA_DESPEGUE,
        Math.abs(j.y - Y_VUELO) <= BANDA_DESPEGUE,
        "ALTURA DE VUELO"
      );

      dibujarSombra();

      const angulo = -0.2 * Math.min(1, j.altitud * 4);

      dibujarAvion(AVION.x, j.y, angulo);
      dibujarHUDDespegue();
    }

    // ---------- VUELO ----------

    function totalObstaculos() {
      return Math.max(1, Math.ceil(metaRef.current / 10));
    }

    function largoNivel() {
      return (
        (totalObstaculos() - 1) * dificultadRef.current.separacion +
        (ANCHO - AVION.x + OBS_ANCHO)
      );
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

      if (alCompletarRef.current) {
        alCompletarRef.current(j.millas);
      }
    }

    function elegirAltura(d) {
      const minimo = 60;
      const maximo = ALTO - SUELO - d.hueco - 60;

      let desde = minimo;
      let hasta = maximo;

      if (j.ultimoArriba !== null) {
        const framesEntre = d.separacion / d.velocidad;
        const desnivel = framesEntre * 2;

        desde = Math.max(minimo, j.ultimoArriba - desnivel);
        hasta = Math.min(maximo, j.ultimoArriba + desnivel);
      }

      const arriba = desde + Math.random() * (hasta - desde);

      j.ultimoArriba = arriba;

      return arriba;
    }

    function aplicarTurbulencia(esc, d) {
      if (d.turbulencia <= 0) return;

      j.proximaRafaga -= esc;

      if (j.proximaRafaga <= 0) {
        j.rafagaTiempo = 25 + Math.random() * 20;

        const signo = Math.random() < 0.5 ? -1 : 1;

        j.rafagaFuerza =
          signo * d.turbulencia * (0.06 + Math.random() * 0.08);

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

      aplicarTurbulencia(esc, d);

      j.vel = Math.max(
        -9,
        Math.min(j.vel + d.gravedad * esc, MAX_CAIDA)
      );

      j.y += j.vel * esc;

      j.distancia += d.velocidad * esc;
      j.recorrido += d.velocidad * esc;

      // CAMBIO: el fondo avanza parejo desde donde terminó el despegue
      // hasta el punto de aproximación (a 1250 px de la pista).
      // Si alguien despegó muy lento, se garantiza un avance mínimo
      // para que el fondo igual se siga moviendo.
      const progreso = limitar(j.recorrido / largoNivel(), 0, 1);
      const framesNivel = largoNivel() / d.velocidad;

      const minimo =
        j.scrollVuelo0 + framesNivel * VEL_FONDO_CRUCERO * 16.67;

      const destino = Math.max(
        j.scrollVuelo0,
        Math.min(
          Math.max(scrollAproximacion(), minimo),
          pistaImgX() - 700
        )
      );

      j.scroll =
        j.scrollVuelo0 + (destino - j.scrollVuelo0) * progreso;

      if (j.distancia >= d.separacion) {
        j.distancia -= d.separacion;

        if (j.generados < total) {
          j.obstaculos.push({
            x: ANCHO,
            arriba: elegirAltura(d),
            pasado: false,
          });

          j.generados += 1;
        }
      }

      const mx = 45;
      const my = 15;

      for (const o of j.obstaculos) {
        o.x -= d.velocidad * esc;

        if (!o.pasado && o.x + OBS_ANCHO < AVION.x) {
          o.pasado = true;
          j.millas += 10;
        }

        const dentroEnX =
          AVION.x + mx > o.x &&
          AVION.x - mx < o.x + OBS_ANCHO;

        const fueraDelHueco =
          j.y - my < o.arriba ||
          j.y + my > o.arriba + d.hueco;

        if (dentroEnX && fueraDelHueco) {
          perder();
          return;
        }
      }

      j.obstaculos = j.obstaculos.filter(
        (o) => o.x > -OBS_ANCHO - 10
      );

      if (j.y - my < 0 || j.y + my > ALTO - SUELO) {
        perder();
        return;
      }

      if (j.millas >= metaRef.current && j.generados >= total) {
        const libre = j.obstaculos.every(
          (o) => o.x + OBS_ANCHO < AVION.x - mx
        );

        if (libre) iniciarAterrizaje();
      }
    }

    function dibujarObstaculos() {
      const d = dificultadRef.current;

      for (const o of j.obstaculos) {
        const inferior = o.arriba + d.hueco;

        // La columna inferior llega hasta el borde del escenario.
        // La colisión continúa limitada por el suelo lógico.
        const altoInferior = ALTO - inferior;

        rect(o.x, 0, OBS_ANCHO, o.arriba, AZUL);
        rect(o.x, inferior, OBS_ANCHO, altoInferior, AZUL);

        rect(
          o.x + 8,
          0,
          6,
          o.arriba,
          "rgba(255,255,255,0.18)"
        );

        rect(
          o.x + 8,
          inferior,
          6,
          altoInferior,
          "rgba(255,255,255,0.18)"
        );

        redondeado(
          o.x - 6,
          o.arriba - 18,
          OBS_ANCHO + 12,
          18,
          6,
          ROJO
        );

        redondeado(
          o.x - 6,
          inferior,
          OBS_ANCHO + 12,
          18,
          6,
          ROJO
        );
      }
    }

    function dibujarNiebla() {
      const d = dificultadRef.current;

      if (d.niebla <= 0) return;

      const g = ctx.createLinearGradient(
        ANCHO * 0.3,
        0,
        ANCHO * 0.8,
        0
      );

      g.addColorStop(0, "rgba(226,236,248,0)");
      g.addColorStop(1, `rgba(226,236,248,${d.niebla})`);

      ctx.fillStyle = g;
      ctx.fillRect(ANCHO * 0.3, 0, ANCHO * 0.7, ALTO);
    }

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

        ctx.lineTo(
          x + 70,
          y + (j.rafagaFuerza < 0 ? -10 : 10)
        );

        ctx.stroke();
      }

      ctx.lineCap = "butt";

      redondeado(ANCHO / 2 - 90, 70, 180, 26, 13, ROJO);
      texto("¡TURBULENCIA!", ANCHO / 2, 88, 12, "#fff", "800");
    }

    function dibujarVuelo() {
      dibujarFondo(j.scroll);
      dibujarObstaculos();

      if (!imagenFondo) {
        rect(0, ALTO - SUELO, ANCHO, SUELO, AZUL);
        rect(0, ALTO - SUELO, ANCHO, 5, ROJO);
      }

      dibujarNiebla();
      dibujarRafaga();

      const temblor =
        j.rafagaTiempo > 0
          ? Math.sin(j.nube * 0.06) * 0.05
          : 0;

      const rot =
        Math.max(-0.4, Math.min(0.6, j.vel * 0.05)) + temblor;

      dibujarAvion(AVION.x, j.y, rot);

      if (MOSTRAR_CAJA) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(AVION.x - 45, j.y - 15, 90, 30);
      }

      dibujarHUDVuelo();
    }

    // ---------- ATERRIZAJE ----------

    function iniciarAterrizaje() {
      j.estado = "aterrizando";
      j.faseAt = "estabilizar";
      j.estabilizacion = 0;
      j.pistaX = pistaImgX() - j.scroll;
      j.y = Math.min(j.y, Y_TOQUE - 80);
      j.rafagaTiempo = 0;
      j.proximaRafaga = 120;
    }

    function empezarDescenso() {
      j.faseAt = "descenso";
      j.y0 = j.y;
      j.tDesc = 0;
    }

    function fallarAterrizaje(motivo) {
      j.estado = "aterrizajeFallido";
      j.motivo = motivo;
      j.tPerdio = performance.now();
    }

    function aterrizarBien(a) {
      j.faseAt = "rodaje";

      j.suavidad = limitar(
        1 - Math.max(0, j.vel) / a.toqueMax,
        0,
        1
      );

      j.y = Y_TOQUE;
      j.vel = 0;
      j.altitud = 0;
      j.tRodaje = 0;

      // CAMBIO: el rodaje arranca desde donde está el fondo y avanza
      // DIST_RODAJE (la distancia justa para empezar a la misma velocidad
      // que traía el descenso y frenar de a poco).
      j.scrollRodaje0 = j.scroll;
      j.scrollRodajeFin = Math.min(
        medidasFondo().maxScroll,
        j.scroll + DIST_RODAJE
      );
    }

    function actualizarAterrizaje(dt) {
      const d = dificultadRef.current;
      const a = ajustesAterrizaje(d);
      const esc = dt / 16.67;
      const maxScroll = medidasFondo().maxScroll;

      if (j.reiniciarScroll) {
        j.scroll = scrollAproximacion();
        j.reiniciarScroll = false;
      }

      for (const o of j.obstaculos) {
        o.x -= d.velocidad * esc;
      }

      j.obstaculos = j.obstaculos.filter(
        (o) => o.x > -OBS_ANCHO - 10
      );

      // RODAJE: el avión frena de a poco después de tocar la pista.
      if (j.faseAt === "rodaje") {
        j.tRodaje += dt;

        const t = Math.min(1, j.tRodaje / DURACION_RODAJE);

        // t * (2 - t) arranca con movimiento y va frenando suave hasta el final
        j.scroll =
          j.scrollRodaje0 +
          (j.scrollRodajeFin - j.scrollRodaje0) * (t * (2 - t));

        j.pistaX = pistaImgX() - j.scroll;

        if (j.tRodaje >= DURACION_RODAJE) {
          j.scroll = j.scrollRodajeFin;
          j.pistaX = pistaImgX() - j.scroll;
          completar();
        }

        return;
      }

      // Control del avión
      const objetivo = apretando.current ? SUBE_MAX : BAJA_MAX;

      j.vel += (objetivo - j.vel) * SUAVIZADO * esc;

      aplicarTurbulencia(esc, d);

      j.y += j.vel * esc;

      if (j.y < 50) {
        j.y = 50;
        j.vel = Math.max(j.vel, 0);
      }

      j.altitud = limitar(
        (Y_TOQUE - j.y) / (Y_TOQUE - Y_VUELO),
        0,
        1
      );

      // El fondo sigue avanzando durante toda la aproximación.
      // CAMBIO: en estabilización va a 2,1 px por frame (parecido al vuelo,
      // antes era 1,5 y se sentía como un frenazo); en el descenso, 4,2.
      const velocidadFondo =
        j.faseAt === "estabilizar"
          ? VEL_SUELO * 0.5
          : VEL_SUELO;

      j.scroll = Math.min(
        maxScroll,
        j.scroll + velocidadFondo * esc
      );

      j.pistaX = pistaImgX() - j.scroll;

      // ----- ETAPA 1: ESTABILIZAR -----

      if (j.faseAt === "estabilizar") {
        const dentro =
          Math.abs(j.y - Y_VUELO) <= a.mitadBanda;

        const paso = dt / TIEMPO_ESTABILIZAR;

        j.estabilizacion = dentro
          ? Math.min(1, j.estabilizacion + paso)
          : Math.max(0, j.estabilizacion - paso * 1.5);

        if (j.y >= Y_TOQUE) {
          fallarAterrizaje(
            "Bajaste antes de estabilizar la altura"
          );

          return;
        }

        if (j.estabilizacion >= 1) {
          empezarDescenso();
        }

        return;
      }

      // ----- ETAPA 2: DESCENSO -----

      j.tDesc += esc;

      const zonaIni = j.pistaX + ZONA_DESDE;
      const zonaFin = zonaIni + a.zonaLargo;

      // Margen adicional para que el aterrizaje sea más fácil.
      const margenToque = 55;

      if (j.y >= Y_TOQUE) {
        if (AVION.x < j.pistaX - margenToque) {
          fallarAterrizaje("Tocaste antes de la pista");
        } else if (AVION.x < zonaIni - margenToque) {
          fallarAterrizaje("Tocaste antes de la zona de toque");
        } else if (AVION.x > zonaFin + margenToque) {
          fallarAterrizaje("Te pasaste de la zona de toque");
        } else if (j.vel > a.toqueMax) {
          fallarAterrizaje("Toque demasiado brusco");
        } else {
          aterrizarBien(a);
        }

        return;
      }

      if (zonaFin + margenToque < AVION.x) {
        fallarAterrizaje("Te pasaste de la zona de toque");
      }
    }

    function dibujarPistaAterrizaje(a) {
      const zi = j.pistaX + ZONA_DESDE;
      const zf = zi + a.zonaLargo;

      if (zf < 0 || zi > ANCHO) return;

      const encima = AVION.x >= zi && AVION.x <= zf;

      rect(
        zi,
        PISTA_Y,
        a.zonaLargo,
        PISTA_ALTO,
        encima
          ? "rgba(43,214,123,0.55)"
          : "rgba(43,214,123,0.32)"
      );

      rect(zi, PISTA_Y, 5, PISTA_ALTO, VERDE);
      rect(zf - 5, PISTA_Y, 5, PISTA_ALTO, VERDE);

      const centro = zi + a.zonaLargo / 2;

      rect(centro - 45, PISTA_Y + 22, 90, 12, "#ffffff");

      rect(
        centro - 45,
        PISTA_Y + PISTA_ALTO - 32,
        90,
        12,
        "#ffffff"
      );

      const etiqueta = aeropuertoRef.current
        ? `ZONA DE TOQUE · ${aeropuertoRef.current}`
        : "ZONA DE TOQUE";

      redondeado(
        centro - 120,
        PISTA_Y - 48,
        240,
        32,
        16,
        VERDE
      );

      texto(
        etiqueta,
        centro,
        PISTA_Y - 26,
        14,
        AZUL,
        "bold"
      );
    }

    function dibujarSenda(a) {
      const ax = AVION.x - VEL_SUELO * j.tDesc;
      const ay = j.y0;

      const bx =
        j.pistaX + ZONA_DESDE + a.zonaLargo / 2;

      const by = Y_TOQUE;

      const t = (AVION.x - ax) / (bx - ax);
      const yLinea = ay + (by - ay) * t;

      const dentro = Math.abs(j.y - yLinea) <= a.corredor;
      const color = dentro ? VERDE : "#ffb020";

      ctx.fillStyle = dentro
        ? "rgba(43,214,123,0.28)"
        : "rgba(255,176,32,0.22)";

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
      if (j.faseAt === "rodaje") {
        redondeado(260, 150, 480, 118, 22, VERDE);

        texto(
          "¡ATERRIZASTE!",
          ANCHO / 2,
          212,
          48,
          AZUL,
          "800"
        );

        texto(
          j.suavidad > 0.5
            ? "Toque suave"
            : "Toque firme pero seguro",
          ANCHO / 2,
          246,
          18,
          AZUL,
          "bold"
        );

        return;
      }

      const estabilizando = j.faseAt === "estabilizar";

      panel(20, 20, 470, 108);

      texto(
        estabilizando
          ? "ETAPA 1 · ESTABILIZÁ"
          : "ETAPA 2 · DESCENDÉ",
        40,
        54,
        22,
        "#fff",
        "bold",
        "left"
      );

      texto(
        estabilizando
          ? "Mantené el avión en la franja verde"
          : "Seguí la senda y tocá la zona verde",
        40,
        80,
        15,
        LILA,
        "normal",
        "left"
      );

      texto(
        estabilizando
          ? "Apretá para subir · soltá para bajar"
          : "Apretá para frenar la caída · soltá para bajar",
        40,
        104,
        15,
        "#fff",
        "bold",
        "left"
      );

      if (estabilizando) {
        const dentro =
          Math.abs(j.y - Y_VUELO) <= a.mitadBanda;

        medidor(
          740,
          20,
          "ESTABILIZACIÓN",
          j.estabilizacion,
          dentro ? VERDE : ROJO
        );

        medidor(
          740,
          108,
          "ALTITUD",
          j.altitud,
          dentro ? VERDE : "#7ec8f2"
        );
      } else {
        const suaveOk = j.vel <= a.toqueMax;

        medidor(
          740,
          20,
          "DESCENSO",
          limitar(Math.max(j.vel, 0) / BAJA_MAX, 0, 1),
          suaveOk ? VERDE : ROJO,
          {
            valor: a.toqueMax / BAJA_MAX,
            texto: "MÁX",
          },
          suaveOk ? "SUAVE" : "MUY RÁPIDO"
        );

        medidor(
          740,
          108,
          "ALTITUD",
          j.altitud,
          "#7ec8f2"
        );
      }
    }

    function dibujarAterrizaje() {
      const d = dificultadRef.current;
      const a = ajustesAterrizaje(d);

      dibujarFondo(j.scroll, true);
      dibujarPistaAterrizaje(a);
      dibujarObstaculos();

      if (j.faseAt === "estabilizar") {
        dibujarFranja(
          a.mitadBanda,
          Math.abs(j.y - Y_VUELO) <= a.mitadBanda,
          "ALTURA DE APROXIMACIÓN"
        );
      } else {
        if (j.faseAt === "descenso") {
          dibujarSenda(a);
        }

        dibujarSombra();
      }

      dibujarNiebla();
      dibujarRafaga();

      let rot = 0;

      if (j.faseAt !== "rodaje") {
        const temblor =
          j.rafagaTiempo > 0
            ? Math.sin(j.nube * 0.06) * 0.05
            : 0;

        rot = limitar(j.vel * 0.06, -0.25, 0.3) + temblor;
      }

      dibujarAvion(AVION.x, j.y, rot);
      dibujarHUDAterrizaje(a);
    }

    // ---------- CARTELES DE FALLO ----------

    function cartelCanvas(titulo, lineas, textoBoton) {
      rect(
        0,
        0,
        ANCHO,
        ALTO,
        "rgba(16,20,21,0.7)"
      );

      redondeado(280, 175, 440, 290, 24, AZUL);

      texto(titulo, ANCHO / 2, 235, 26);

      lineas.forEach((l, i) => {
        texto(
          l.t,
          ANCHO / 2,
          283 + i * 32,
          l.tam,
          LILA,
          "normal"
        );
      });

      redondeado(345, 350, 310, 52, 26, ROJO);
      texto(textoBoton, ANCHO / 2, 383, 17);
    }

    // ---------- DIBUJO Y BUCLE ----------

    function dibujar() {
      ctx.clearRect(0, 0, ANCHO, ALTO);

      if (j.estado === "instrucciones") {
        dibujarFondo(0, true);
        return;
      }

      if (j.estado === "despegando") {
        dibujarDespegue();
        return;
      }

      if (
        j.estado === "aterrizando" ||
        j.estado === "aterrizajeFallido" ||
        j.estado === "completado"
      ) {
        dibujarAterrizaje();

        if (j.estado === "aterrizajeFallido") {
          cartelCanvas(
            "ATERRIZAJE FALLIDO",
            [
              { t: j.motivo, tam: 18 },
              {
                t: "Probá de nuevo desde la aproximación",
                tam: 15,
              },
            ],
            "MOTOR Y AL AIRE"
          );
        }

        if (j.estado === "completado") {
          rect(
            0,
            0,
            ANCHO,
            ALTO,
            "rgba(16,20,21,0.35)"
          );
        }

        return;
      }

      dibujarVuelo();

      if (j.estado === "perdiste") {
        cartelCanvas(
          "VUELO INTERRUMPIDO",
          [
            {
              t: `Millas recorridas: ${j.millas}`,
              tam: 18,
            },
            {
              t: `Récord: ${j.record} millas`,
              tam: 15,
            },
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

      if (j.estado === "despegando") {
        actualizarDespegue(dt);
      } else if (j.estado === "jugando") {
        actualizarVuelo(dt);
      } else if (j.estado === "aterrizando") {
        actualizarAterrizaje(dt);
      }

      dibujar();

      frame = requestAnimationFrame(bucle);
    }

    // ---------- TECLADO ----------

    function teclaPresionada(e) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();

        if (!e.repeat) {
          presionar();
        }
      }
    }

    function teclaSoltada(e) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        soltar();
      }
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
      // No pasa nada si el navegador no lo permite.
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

      <div
        style={{
          textAlign: "center",
          fontSize: "12px",
          opacity: 0.65,
          marginTop: "8px",
        }}
      >
        Despegue: mantené apretado · Vuelo: tocá para subir ·
        Aterrizaje: mantené para subir, soltá para bajar
      </div>
    </div>
  );
}