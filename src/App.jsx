import { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Sidebar from './components/sidebar.jsx';
import Destinos from './pages/destinos.jsx';
import Login from './pages/login.jsx';
import DestinoDetalle from './pages/destinodetalle.jsx';
import Ranking from './pages/ranking.jsx';
import Ajustes from './pages/ajustes.jsx';
import CabinaPilotaje from './pages/CabinaPilotaje.jsx';
import Jugar from './pages/jugar.jsx';
import Bienvenida from './pages/bienvenida.jsx';

import {
  sesionGuardada,
  obtenerUsuario,
  cerrarSesion
} from './data/usuarios.js';

import './App.css';

// CAMBIO: ya no hay "Inicio" ni lógica para esconder el sidebar.
// La bienvenida ahora se muestra ANTES de entrar a la app (en App).
function ContenidoApp({ usuario, refrescarUsuario, salir }) {
  return (
    <div className="app-layout">

      <Sidebar usuario={usuario} />

      <Routes>
        {/* CAMBIO: "/" ya no es la bienvenida, lleva a Destinos */}
        <Route path="/" element={<Navigate to="/destinos" replace />} />

        <Route path="/destinos" element={<Destinos />} />

        <Route path="/destinos/:id" element={<DestinoDetalle />} />

        <Route path="/ranking" element={<Ranking usuario={usuario} />} />

        <Route
          path="/jugar/:id"
          element={<Jugar onActualizar={refrescarUsuario} />}
        />

        <Route
          path="/ajustes"
          element={
            <Ajustes
              usuario={usuario}
              onActualizar={refrescarUsuario}
              onSalir={salir}
            />
          }
        />

        <Route
          path="/cabina"
          element={<CabinaPilotaje usuario={usuario} />}
        />
      </Routes>

    </div>
  );
}

function App() {
  const [usuario, setUsuario] = useState(sesionGuardada);

  // CAMBIO: recuerda si ya se vio la bienvenida.
  // Empieza en false, así que es lo primero que aparece.
  const [bienvenidaVista, setBienvenidaVista] = useState(false);

  function refrescarUsuario() {
    setUsuario(obtenerUsuario(usuario.passengerId) || usuario);
  }

  function salir() {
    cerrarSesion();
    setUsuario(null);
    window.history.replaceState(null, '', '/');
  }

  // CAMBIO: 1º la bienvenida
  if (!bienvenidaVista) {
    return <Bienvenida onStart={() => setBienvenidaVista(true)} />;
  }

  // 2º el inicio de sesión (si no hay sesión guardada)
  if (!usuario) {
    return <Login onIngresar={setUsuario} />;
  }

  // 3º la app
  return (
    <BrowserRouter>
      <ContenidoApp
        usuario={usuario}
        refrescarUsuario={refrescarUsuario}
        salir={salir}
      />
    </BrowserRouter>
  );
}

export default App;