import { Link, useLocation } from 'react-router-dom';
import Avatar from './avatar.jsx';
import { calcularTier } from '../data/usuarios.js';

function Sidebar({ usuario }) {
  const { pathname } = useLocation();

  const items = [
    { nombre: 'Destinos', ruta: '/destinos' },
    { nombre: 'Ranking', ruta: '/ranking' },
    { nombre: 'Ajustes', ruta: '/ajustes' },
    { nombre: 'Cabina de pilotaje', ruta: '/cabina' },
  ];

  // El tier sale de las millas del piloto
  const { actual } = calcularTier(usuario?.millas || 0);

  function estaActivo(ruta) {
    if (ruta === '/destinos' && pathname === '/') return true;
    return pathname === ruta || pathname.startsWith(ruta + '/');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__perfil">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Avatar id={usuario?.avatar} tamano={80} />
        </div>
        <h2 className="sidebar__nombre">{usuario?.userName || 'Piloto'}</h2>
        <p className="sidebar__tier">{actual.nombre} tier pilot</p>
      </div>

      <nav className="sidebar__nav">
        <ul>
          {items.map((item) => (
            <li key={item.nombre} className={estaActivo(item.ruta) ? 'activo' : ''}>
              <Link to={item.ruta}>{item.nombre}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;