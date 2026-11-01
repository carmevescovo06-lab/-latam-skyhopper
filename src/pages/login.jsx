import { useState } from 'react';
import { iniciarSesion } from '../data/usuarios.js';

function Login({ onIngresar }) {
  const [passengerId, setPassengerId] = useState('');
  const [userName, setUserName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!passengerId.trim() || !userName.trim()) return;

    // Busca al piloto por su ID: si ya existía recupera su progreso,
    // y si no, crea una ficha nueva. Después avisa a App.jsx.
    const ficha = iniciarSesion(passengerId, userName);
    onIngresar(ficha);
  }

  return (
    <div className="login">
      <div className="login__card">
        <img src="imagenes/logo-skyhopper.png" alt="SkyHopper" className="login__logo" />

        <form onSubmit={handleSubmit}>
          <label className="login__label">Passenger ID</label>
          <input
            type="text"
            placeholder="SH-XXXX-XX"
            value={passengerId}
            onChange={(e) => setPassengerId(e.target.value)}
            className="login__input"
          />

          <label className="login__label">User name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="login__input"
          />

          <button type="submit" className="login__boton">
            ¡Despegar!
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;