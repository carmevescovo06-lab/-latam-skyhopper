import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/sidebar.jsx';
import Destinos from './pages/destinos.jsx';
import Login from './pages/login.jsx';
import DestinoDetalle from './pages/destinodetalle.jsx';
import Ranking from './pages/ranking.jsx';
import Ajustes from './pages/ajustes.jsx';
import CabinaPilotaje from './pages/CabinaPilotaje.jsx';
import Jugar from './pages/jugar.jsx';
import { sesionGuardada, obtenerUsuario, cerrarSesion } from './data/usuarios.js';
import './App.css';

function App() {
  // Al abrir el juego, si ya había una sesión guardada, entra directo.
  const [usuario, setUsuario] = useState(sesionGuardada);

  // Vuelve a leer la ficha del localStorage y actualiza la pantalla.
  function refrescarUsuario() {
    setUsuario(obtenerUsuario(usuario.passengerId) || usuario);
  }

  function salir() {
    cerrarSesion();
    setUsuario(null);
    window.history.replaceState(null, '', '/');
  }

  if (!usuario) {
    return <Login onIngresar={setUsuario} />;
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar usuario={usuario} />
        <Routes>
          <Route path="/" element={<Destinos />} />
          <Route path="/destinos" element={<Destinos />} />
          <Route path="/destinos/:id" element={<DestinoDetalle />} />
          <Route path="/ranking" element={<Ranking usuario={usuario} />} />
          <Route path="/jugar/:id" element={<Jugar onActualizar={refrescarUsuario} />} />
          <Route
            path="/ajustes"
            element={<Ajustes usuario={usuario} onActualizar={refrescarUsuario} onSalir={salir} />}
          />
          <Route path="/cabina" element={<CabinaPilotaje usuario={usuario} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;