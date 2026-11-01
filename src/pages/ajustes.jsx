import { useState } from 'react';
import Avatar from '../components/avatar.jsx';
import { AVATARES } from '../data/avatares.js';
import { actualizarUsuario, reiniciarProgreso } from '../data/usuarios.js';
import './pantallas.css';

function Ajustes({ usuario, onActualizar, onSalir }) {
  const [nombre, setNombre] = useState(usuario.userName);
  const [mensajeNombre, setMensajeNombre] = useState('');
  const [mensajeProgreso, setMensajeProgreso] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  // Elegir avatar: se guarda al instante
  function elegirAvatar(id) {
    actualizarUsuario(usuario.passengerId, { avatar: id });
    onActualizar();
  }

  // Cambiar nombre: se guarda al apretar el botón
  function guardarNombre(e) {
    e.preventDefault();
    const limpio = nombre.trim();

    if (!limpio) {
      setMensajeNombre('El nombre no puede estar vacío.');
      return;
    }

    actualizarUsuario(usuario.passengerId, { userName: limpio });
    setNombre(limpio);
    setMensajeNombre('Nombre guardado ✓');
    onActualizar();
  }

  // Volumen e idioma: se guardan dentro de "ajustes" de la ficha
  function cambiarAjuste(clave, valor) {
    actualizarUsuario(usuario.passengerId, {
      ajustes: { ...usuario.ajustes, [clave]: valor },
    });
    onActualizar();
  }

  // Borrar progreso (ya confirmado)
  function borrarProgreso() {
    reiniciarProgreso(usuario.passengerId);
    setConfirmando(false);
    setMensajeProgreso('Progreso reiniciado. Empezás de cero.');
    onActualizar();
  }

  return (
    <main className="pantalla">
      <p className="pantalla__etiqueta">Configuración</p>
      <h1 className="pantalla__titulo">Ajustes</h1>
      <p className="pantalla__subtitulo">
        Personalizá tu perfil de piloto. Todo se guarda en este dispositivo.
      </p>

      <div className="ajustes__contenido">
        {/* ----- Columna izquierda: perfil ----- */}
        <div className="ajustes__columna">
          <section className="tarjeta">
            <h2 className="tarjeta__titulo">Perfil del piloto</h2>

            <form onSubmit={guardarNombre}>
              <div className="ajustes__campo">
                <label className="ajustes__label" htmlFor="nombre-piloto">
                  Nombre de usuario
                </label>
                <div className="ajustes__fila">
                  <input
                    id="nombre-piloto"
                    type="text"
                    maxLength={20}
                    value={nombre}
                    onChange={(e) => {
                      setNombre(e.target.value);
                      setMensajeNombre('');
                    }}
                    className="ajustes__input"
                  />
                  <button type="submit" className="pantalla__boton">
                    Guardar
                  </button>
                </div>
                {mensajeNombre && <p className="ajustes__mensaje">{mensajeNombre}</p>}
              </div>
            </form>

            <div className="ajustes__campo">
              <label className="ajustes__label" htmlFor="id-piloto">
                Passenger ID
              </label>
              <input
                id="id-piloto"
                type="text"
                value={usuario.passengerId}
                disabled
                className="ajustes__input"
              />
              <p className="ajustes__ayuda">El ID es tu identidad de piloto y no se puede cambiar.</p>
            </div>
          </section>

          <section className="tarjeta">
            <h2 className="tarjeta__titulo">Elegí tu avatar</h2>
            <div className="ajustes__avatares">
              {AVATARES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-label={`Avatar ${a.nombre}`}
                  aria-pressed={usuario.avatar === a.id}
                  onClick={() => elegirAvatar(a.id)}
                  className={`ajustes__avatar-boton${
                    usuario.avatar === a.id ? ' ajustes__avatar-boton--elegido' : ''
                  }`}
                >
                  <Avatar id={a.id} tamano={56} />
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* ----- Columna derecha: preferencias y datos ----- */}
        <div className="ajustes__columna">
          <section className="tarjeta">
            <h2 className="tarjeta__titulo">Preferencias</h2>

            <div className="ajustes__campo">
              <label className="ajustes__label" htmlFor="volumen">
                <span>Volumen general</span>
                <strong>{usuario.ajustes.volumen}%</strong>
              </label>
              <input
                id="volumen"
                type="range"
                min="0"
                max="100"
                value={usuario.ajustes.volumen}
                onChange={(e) => cambiarAjuste('volumen', Number(e.target.value))}
                className="ajustes__rango"
              />
              <p className="ajustes__ayuda">
                El volumen queda guardado y se va a usar cuando el juego tenga sonido.
              </p>
            </div>

            <div className="ajustes__campo">
              <label className="ajustes__label" htmlFor="idioma">
                Idioma
              </label>
              <select
                id="idioma"
                value={usuario.ajustes.idioma}
                onChange={(e) => cambiarAjuste('idioma', e.target.value)}
                className="ajustes__input"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
              <p className="ajustes__ayuda">
                El idioma queda guardado, pero los textos del juego todavía están solo en español.
              </p>
            </div>
          </section>

          <section className="tarjeta ajustes__peligro">
            <h2 className="tarjeta__titulo">Datos y sesión</h2>
            <p>
              Borrar el progreso reinicia tus millas, XP, medallas y destinos desbloqueados. Tu
              nombre, avatar y ajustes se conservan. No se puede deshacer.
            </p>

            {confirmando && (
              <div className="ajustes__confirmar">
                <p>¿Seguro que querés borrar todo tu progreso?</p>
                <div className="ajustes__fila">
                  <button type="button" className="pantalla__boton pantalla__boton--peligro" onClick={borrarProgreso}>
                    Sí, borrar
                  </button>
                  <button
                    type="button"
                    className="pantalla__boton pantalla__boton--secundario"
                    onClick={() => setConfirmando(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {!confirmando && (
              <div className="ajustes__fila" style={{ flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="pantalla__boton pantalla__boton--peligro"
                  onClick={() => {
                    setMensajeProgreso('');
                    setConfirmando(true);
                  }}
                >
                  Borrar progreso
                </button>
                <button type="button" className="pantalla__boton pantalla__boton--secundario" onClick={onSalir}>
                  Cerrar sesión
                </button>
              </div>
            )}

            {mensajeProgreso && (
              <p className="ajustes__mensaje" style={{ marginTop: 12 }}>
                {mensajeProgreso}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default Ajustes;