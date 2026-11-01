import { obtenerAvatar } from '../data/avatares.js';
import './avatar.css';

// Dibuja el avatar de un piloto. Se usa en Sidebar, Ranking, Ajustes y Cabina.
// Uso:  <Avatar id="condor" tamano={80} />
function Avatar({ id, tamano = 48 }) {
  const avatar = obtenerAvatar(id);

  const estilo = {
    width: tamano,
    height: tamano,
    fontSize: tamano * 0.5,
    background: avatar.color,
  };

  return (
    <div className="avatar" style={estilo} title={avatar.nombre}>
      {avatar.imagen ? (
        <img src={avatar.imagen} alt={avatar.nombre} className="avatar__imagen" />
      ) : (
        avatar.emoji
      )}
    </div>
  );
}

export default Avatar;