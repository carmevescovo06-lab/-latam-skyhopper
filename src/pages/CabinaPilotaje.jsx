import { Link } from 'react-router-dom';
import Avatar from '../components/avatar.jsx';
import destinosData from '../data/destinos.js';
import { calcularTier, calcularLogros } from '../data/usuarios.js';
import './pantallas.css';

function CabinaPilotaje({ usuario }) {
  const { actual, siguiente, progreso } = calcularTier(usuario.millas);
  const logros = calcularLogros(usuario);
  const conseguidos = logros.filter((l) => l.conseguido).length;

  // Millas que hizo en cada destino (para el gráfico)
  const porDestino = destinosData.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    millas: usuario.millasPorDestino[d.id] || 0,
  }));
  const maximo = Math.max(...porDestino.map((d) => d.millas), 1);

  // Récord: el destino donde más millas hizo
  const favorito = porDestino.reduce((mejor, d) => (d.millas > mejor.millas ? d : mejor), porDestino[0]);
  const nombreFavorito = favorito.millas > 0 ? favorito.nombre : '—';

  return (
    <main className="pantalla">
      <p className="pantalla__etiqueta">Perfil del piloto</p>
      <h1 className="pantalla__titulo">Cabina de pilotaje</h1>
      <p className="pantalla__subtitulo">
        Tu centro de mando: resumen de progreso, millas por destino y medallas conseguidas.
      </p>

      {/* ----- Pasajero + estadísticas ----- */}
      <div className="cabina__fila">
        <section className="tarjeta cabina__pasajero">
          <div className="cabina__pasajero-cabecera">
            <Avatar id={usuario.avatar} tamano={72} />
            <div>
              <h2>{usuario.userName}</h2>
              <span className="cabina__etiqueta">Passenger ID</span>
              <span className="cabina__id">{usuario.passengerId}</span>
            </div>
          </div>

          <div>
            <div className="cabina__tier">
              <div>
                <span className="cabina__etiqueta">Rango actual</span>
                <strong>{actual.nombre}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="cabina__etiqueta">Millas totales</span>
                <strong>{usuario.millas.toLocaleString('es-AR')}</strong>
              </div>
            </div>

            <div className="barra" style={{ marginTop: 16 }}>
              <div className="barra__progreso" style={{ width: `${progreso * 100}%` }} />
            </div>
            <p className="cabina__tier-meta">
              {siguiente
                ? `Próximo nivel: ${siguiente.nombre} (${siguiente.desde} millas)`
                : 'Nivel máximo alcanzado'}
            </p>
          </div>
        </section>

        <section className="tarjeta cabina__stats">
          <div className="cabina__stat">
            <span>Vuelos completados</span>
            <strong>{usuario.vuelos}</strong>
          </div>
          <div className="cabina__stat">
            <span>XP ganado</span>
            <strong>{usuario.xp.toLocaleString('es-AR')}</strong>
          </div>
          <div className="cabina__stat">
            <span>Destinos alcanzados</span>
            <strong>
              {usuario.destinosCompletados.length} / {destinosData.length}
            </strong>
          </div>
          <div className="cabina__stat">
            <span>Destino favorito</span>
            <strong>{nombreFavorito}</strong>
          </div>
        </section>
      </div>

      {/* ----- Gráfico: millas por destino ----- */}
      <section className="tarjeta" style={{ marginBottom: 24 }}>
        <h2 className="tarjeta__titulo">Millas por destino</h2>
        <div className="cabina__grafico">
          {porDestino.map((d) => (
            <div key={d.id} className="cabina__col">
              <span className="cabina__valor">{d.millas}</span>
              <div className="cabina__pista">
                <div className="cabina__barra" style={{ height: `${(d.millas / maximo) * 100}%` }} />
              </div>
              <span className="cabina__col-nombre">{d.nombre}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ----- Medallas ----- */}
      <section className="tarjeta">
        <h2 className="tarjeta__titulo">
          Medallas · {conseguidos} de {logros.length}
        </h2>

        <div className="cabina__medallas-grid">
          {logros.map((logro) => (
            <div
              key={logro.id}
              className={`medalla${logro.conseguido ? '' : ' medalla--bloqueada'}`}
            >
              <div className="medalla__icono">{logro.icono}</div>
              <strong>{logro.nombre}</strong>
              <p>{logro.descripcion}</p>
              <span className="medalla__estado">
                {logro.conseguido ? 'Conseguida' : `${logro.actual} / ${logro.total}`}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="cabina__acciones">
        <Link to="/destinos" className="pantalla__boton">
          Ir a Destinos →
        </Link>
      </div>
    </main>
  );
}

export default CabinaPilotaje;