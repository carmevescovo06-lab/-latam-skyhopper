import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Juego from "../components/juego.jsx";
import Briefing from "../components/briefing.jsx";
import destinosData from "../data/destinos.js";
import { desbloquear, estaBloqueado, registrarVuelo } from "../data/progreso.js";

// Colores del confeti: los de la identidad SkyHopper + blanco
const COLORES = ["#1B0088", "#EB0045", "#007CE0", "#ffffff"];

// 50 papelitos con posición, demora, duración y color distintos
const CONFETI = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  izquierda: Math.random() * 100,
  demora: Math.random() * 2,
  duracion: 3 + Math.random() * 3,
  color: COLORES[i % COLORES.length],
}));

export default function Jugar({ onActualizar }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [completado, setCompletado] = useState(false);
  const [millasFinal, setMillasFinal] = useState(0);
  // true mientras se ve el cartel de instrucciones antes de despegar
  const [verBriefing, setVerBriefing] = useState(true);

  const destino = destinosData.find((d) => d.id === Number(id));

  if (!destino || estaBloqueado(destino.id)) {
    return <Navigate to="/destinos" replace />;
  }

  const siguiente = destinosData.find((d) => d.id === destino.id + 1);

  // El juego nos avisa con las millas que hiciste, cuando el avión ya aterrizó
  function alCompletar(millas) {
    if (siguiente) desbloquear(siguiente.id);

    // Guarda en la ficha del piloto: millas, vuelo completado y XP
    registrarVuelo(destino.id, millas, destino.detalle?.xp || 0);

    // Avisa a App.jsx para que el Sidebar (tier) se actualice
    if (onActualizar) onActualizar();

    setMillasFinal(millas);
    setCompletado(true);
  }

  return (
    <main className="jugar">
      {/* zIndex 20: así el botón Volver queda por encima del cartel de instrucciones */}
      <button
        className="login__boton jugar__volver"
        style={{ zIndex: 20 }}
        onClick={() => navigate(-1)}
      >
        ← Volver
      </button>

      <Juego
        meta={destino.meta}
        fondo={destino.fondoJuego}
        dificultad={destino.dificultad}
        ciudad={destino.detalle?.ciudad}
        aeropuerto={destino.detalle?.ruta?.destino}
        esperando={verBriefing}
        onNivelCompleto={alCompletar}
      />

      {verBriefing && <Briefing destino={destino} onEmpezar={() => setVerBriefing(false)} />}

      {completado && (
        <div className="jugar__fin">
          {CONFETI.map((c) => (
            <span
              key={c.id}
              className="confeti"
              style={{
                left: `${c.izquierda}%`,
                backgroundColor: c.color,
                animationDelay: `${c.demora}s`,
                animationDuration: `${c.duracion}s`,
              }}
            />
          ))}

          <div className="jugar__tarjeta">
            <span className="jugar__sello">✈ Destino alcanzado</span>
            <h2 className="jugar__felicitacion">¡Felicitaciones!</h2>
            <p className="jugar__lugar">
              Aterrizaste en <strong>{destino.detalle?.ciudad || destino.nombre}</strong>
            </p>

            <div className="jugar__stats">
              <div>
                <span>Millas</span>
                <strong>{millasFinal}</strong>
              </div>
              {destino.detalle && (
                <div>
                  <span>XP</span>
                  <strong>+{destino.detalle.xp}</strong>
                </div>
              )}
            </div>

            {siguiente && (
              <p className="jugar__desbloqueo">🔓 Desbloqueaste {siguiente.nombre}</p>
            )}

            {siguiente ? (
              <button
                className="login__boton"
                onClick={() => navigate(`/destinos/${siguiente.id}`)}
              >
                Ir a {siguiente.nombre} →
              </button>
            ) : (
              <button className="login__boton" onClick={() => navigate("/destinos")}>
                Volver a Destinos
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}