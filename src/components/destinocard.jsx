import { Link } from 'react-router-dom';

function DestinoCard({ destino }) {
  const contenido = (
    <div className={`destino-card ${destino.bloqueado ? 'destino-card--bloqueado' : ''}`}>
      <img src={destino.imagen} alt={destino.nombre} className="destino-card__imagen" />
      <div className="destino-card__info">
        <h3>{destino.nombre}</h3>
        {destino.bloqueado && <span className="destino-card__candado">🔒 Bloqueado</span>}
      </div>
    </div>
  );

  if (destino.bloqueado) return contenido;

  return (
    <Link to={`/destinos/${destino.id}`} className="destino-card-link">
      {contenido}
    </Link>
  );
}

export default DestinoCard;