import { Link, Navigate, useParams } from 'react-router-dom';
import destinosData from '../data/destinos.js';
import { estaBloqueado } from '../data/progreso.js';
import './dificultad.css';

// Convierte un número real (por ejemplo velocidad 3.8) en un nivel de 1 a 5
function nivelDe(valor, minimo, maximo) {
  const t = (valor - minimo) / (maximo - minimo);
  return Math.max(1, Math.min(5, Math.round(1 + t * 4)));
}

// Los medidores que se muestran. Cada uno devuelve cuántos segmentos se llenan (0 a 5).
// Los números (3.2, 4.5, 210...) son los valores de Argentina y de Japón:
// el más fácil y el más difícil de los dos extremos.
const MEDIDORES = [
  { etiqueta: 'Velocidad', nivel: (d) => nivelDe(d.velocidad, 3.2, 4.5) },
  { etiqueta: 'Espacio ajustado', nivel: (d) => nivelDe(210 - d.hueco, 0, 40) },
  { etiqueta: 'Caída', nivel: (d) => Math.max(0, Math.min(5, Math.round((d.gravedad - 0.34) / 0.02))) },
  { etiqueta: 'Turbulencia', nivel: (d) => Math.round(d.turbulencia * 5) },
  { etiqueta: 'Niebla', nivel: (d) => Math.round(d.niebla * 5) },
];

function DestinoDetalle() {
  const { id } = useParams();
  const destino = destinosData.find((d) => d.id === Number(id));

  if (!destino) {
    return <p>Destino no encontrado</p>;
  }
  if (estaBloqueado(destino.id)) {
    return <Navigate to="/destinos" replace />;
  }

  const { detalle, dificultad } = destino;
  const siguiente = destinosData.find((d) => d.id === destino.id + 1);

  return (
    <div className="destino-detalle">
      <div
        className="destino-detalle__hero"
        style={{ backgroundImage: `url(${destino.imagen})` }}
      >
        <Link to="/destinos" className="destino-detalle__volver">
          ← Volver a Destinos
        </Link>

        <div className="destino-detalle__etiquetas">
          <span className="destino-detalle__estado">Destino alcanzado</span>
          {detalle && <span className="destino-detalle__xp">+{detalle.xp} XP</span>}
        </div>
        <h1 className="destino-detalle__titulo">{detalle?.ciudad || destino.nombre}</h1>
        {detalle && <p className="destino-detalle__ubicacion">{detalle.ubicacion}</p>}
      </div>

      {detalle ? (
        <div className="destino-detalle__contenido">
          <div className="destino-detalle__principal">
            <div className="destino-detalle__datos">
              <div>
                <span>Elevación</span>
                <strong>{detalle.elevacion}</strong>
              </div>
              <div>
                <span>Pista</span>
                <strong>{detalle.pista}</strong>
              </div>
              <div>
                <span>Hora local</span>
                <strong>{detalle.horaLocal}</strong>
              </div>
              <div>
                <span>Clima</span>
                <strong>{detalle.clima}</strong>
              </div>
            </div>

            {/* ----- Dificultad del vuelo ----- */}
            {dificultad && (
              <div className="destino-detalle__dificultad">
                <div>
                  <p className="dificultad__titulo">Dificultad del vuelo</p>

                  <div className="dificultad__estrellas" aria-label={`Dificultad ${dificultad.nivel} de 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={i < dificultad.nivel ? '' : 'dificultad__estrella--vacia'}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <h3 className="dificultad__desafio">{dificultad.desafio}</h3>
                  <p className="dificultad__descripcion">{dificultad.descripcion}</p>
                </div>

                <div className="dificultad__medidores">
                  {MEDIDORES.map((m) => {
                    const lleno = m.nivel(dificultad);
                    return (
                      <div key={m.etiqueta} className="dificultad__medidor">
                        <span>{m.etiqueta}</span>
                        <div className="dificultad__segmentos">
                          {Array.from({ length: 5 }, (_, i) => (
                            <div
                              key={i}
                              className={`dificultad__segmento${
                                i < lleno ? ' dificultad__segmento--lleno' : ''
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="destino-detalle__descripcion">
              <div className="destino-detalle__texto">
                <h2>{detalle.titulo}</h2>
                <p>{detalle.descripcion}</p>
              </div>
              <div className="destino-detalle__video">
                <button className="destino-detalle__play">▶</button>
                <span className="destino-detalle__duracion">{detalle.duracionVideo}</span>
              </div>
            </div>

            <div className="destino-detalle__ruta">
              <div className="destino-detalle__ruta-encabezado">
                <span>Progreso de ruta</span>
                <span>
                  {detalle.ruta.origen} → {detalle.ruta.destino}
                </span>
              </div>
              <div className="destino-detalle__barra">
                <div className="destino-detalle__barra-progreso" />
              </div>
              <div className="destino-detalle__ruta-pie">
                <span>{detalle.ruta.ciudadOrigen}</span>
                <span>Llegada</span>
              </div>
            </div>
          </div>

          <div className="destino-detalle__lateral">
            <div className="destino-detalle__sabias">
              <h3>¿Sabías que?</h3>
              <p>{detalle.sabiasQue}</p>
            </div>

            <div className="destino-detalle__puntos">
              <h3>Puntos de interés imperdibles</h3>
              <ul>
                {detalle.puntos.map((punto) => (
                  <li key={punto.nombre}>
                    <strong>{punto.nombre}</strong>
                    <span>{punto.descripcion}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to={`/jugar/${destino.id}`}
              className="destino-detalle__boton destino-detalle__boton--principal"
            >
              ✈ Jugar
            </Link>

            {siguiente && !estaBloqueado(siguiente.id) && (
              <Link
                to={`/destinos/${siguiente.id}`}
                className="destino-detalle__boton destino-detalle__boton--secundario"
              >
                Continuar al siguiente destino
              </Link>
            )}
          </div>
        </div>
      ) : (
        <p className="destino-detalle__pendiente">
          La información de este destino estará disponible pronto.
        </p>
      )}
    </div>
  );
}

export default DestinoDetalle;