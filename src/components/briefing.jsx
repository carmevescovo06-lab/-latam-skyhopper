import { useEffect } from "react";
import "./briefing.css";

// Los controles se explican solo en el primer nivel (Argentina).
// En los demás niveles el cartel muestra solamente lo particular de ese país.
const ID_PRIMER_NIVEL = 1;

// Gravedad de Argentina: si un país tiene más, el avión cae más rápido
const GRAVEDAD_BASE = 0.34;

const PASOS = [
  { titulo: "ACELERÁ", detalle: "Mantené apretado para despegar" },
  { titulo: "TOCÁ", detalle: "Para subir en vuelo" },
  { titulo: "ESQUIVÁ", detalle: "Y sumá millas hasta la meta" },
];

// Los consejos salen de los números de la dificultad de cada país (destinos.js)
function armarConsejos(d) {
  const consejos = [];

  if (d.turbulencia > 0) {
    consejos.push("Cuando aparezca el cartel ¡TURBULENCIA!, corregí la altura con toques cortos.");
  }
  if (d.gravedad > GRAVEDAD_BASE) {
    consejos.push("El avión cae más rápido: tocá un poco más seguido.");
  }
  if (d.niebla > 0) {
    consejos.push("Los obstáculos se ven tarde: fijate siempre en el próximo hueco.");
  }

  return consejos;
}

function Briefing({ destino, onEmpezar }) {
  const { dificultad, detalle } = destino;
  const ciudad = detalle?.ciudad || destino.nombre;
  const esPrimerNivel = destino.id === ID_PRIMER_NIVEL;
  const consejos = dificultad ? armarConsejos(dificultad) : [];

  // También se puede empezar con ESPACIO, ENTER o la flecha ↑
  useEffect(() => {
    function alApretarTecla(e) {
      if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!e.repeat) onEmpezar();
      }
    }

    window.addEventListener("keydown", alApretarTecla);
    return () => window.removeEventListener("keydown", alApretarTecla);
  }, [onEmpezar]);

  return (
    <div className="briefing">
      <div className="briefing__tarjeta">
        <span className="briefing__sello">✈ Briefing de vuelo · {ciudad}</span>

        <h2 className="briefing__titulo">
          {esPrimerNivel ? "Cómo se juega" : dificultad?.desafio || "Listo para volar"}
        </h2>

        <p className="briefing__texto">
          {esPrimerNivel
            ? `Esquivá los obstáculos y sumá ${destino.meta} millas para llegar a ${ciudad}.`
            : dificultad?.descripcion}
        </p>

        {dificultad && (
          <div className="briefing__stats">
            <div>
              <span>Dificultad</span>
              <strong className="briefing__estrellas" aria-label={`${dificultad.nivel} de 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={i < dificultad.nivel ? "" : "briefing__estrella--vacia"}>
                    ★
                  </span>
                ))}
              </strong>
            </div>
            <div>
              <span>Meta</span>
              <strong>{destino.meta} millas</strong>
            </div>
          </div>
        )}

        {/* Controles: solo en el primer nivel */}
        {esPrimerNivel && (
          <div className="briefing__pasos">
            {PASOS.map((paso, i) => (
              <div key={paso.titulo} className="briefing__paso">
                <span className="briefing__numero">{i + 1}</span>
                <strong>{paso.titulo}</strong>
                <p>{paso.detalle}</p>
              </div>
            ))}
          </div>
        )}

        {esPrimerNivel && (
          <p className="briefing__consejo">Si chocás, tenés que volver a despegar desde la pista.</p>
        )}

        {/* Consejos particulares de cada país */}
        {consejos.map((consejo) => (
          <p key={consejo} className="briefing__consejo">
            {consejo}
          </p>
        ))}

        <button className="login__boton" onClick={onEmpezar}>
          ✈ Despegar
        </button>
        <span className="briefing__ayuda">o apretá ESPACIO</span>
      </div>
    </div>
  );
}

export default Briefing;