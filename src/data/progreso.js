// Progreso del juego del piloto que tiene la sesión iniciada.
// Ahora todo se guarda en la ficha de cada usuario (ver usuarios.js).

import destinosData from './destinos.js';
import { usuarioActual, actualizarUsuario } from './usuarios.js';

// ¿Este destino está bloqueado para el piloto actual?
// Si en destinos.js dice bloqueado: false, nunca está bloqueado.
// Si dice true, queda desbloqueado cuando el piloto lo consigue jugando.
export function estaBloqueado(idDestino) {
  const destino = destinosData.find((d) => d.id === Number(idDestino));
  if (!destino) return true;
  if (!destino.bloqueado) return false;

  const usuario = usuarioActual();
  return !(usuario && usuario.desbloqueados.includes(destino.id));
}

// Desbloquea un destino para el piloto actual
export function desbloquear(idDestino) {
  const usuario = usuarioActual();
  if (!usuario || usuario.desbloqueados.includes(idDestino)) return usuario;

  return actualizarUsuario(usuario.passengerId, {
    desbloqueados: [...usuario.desbloqueados, idDestino],
  });
}

// Se llama cuando el piloto completa un nivel: suma millas, vuelos y XP.
// El XP se da solo la primera vez que completa ese destino.
export function registrarVuelo(idDestino, millas, xp = 0) {
  const usuario = usuarioActual();
  if (!usuario) return null;

  const primeraVez = !usuario.destinosCompletados.includes(idDestino);

  return actualizarUsuario(usuario.passengerId, {
    millas: usuario.millas + millas,
    xp: primeraVez ? usuario.xp + xp : usuario.xp,
    vuelos: usuario.vuelos + 1,
    millasPorDestino: {
      ...usuario.millasPorDestino,
      [idDestino]: (usuario.millasPorDestino[idDestino] || 0) + millas,
    },
    destinosCompletados: primeraVez
      ? [...usuario.destinosCompletados, idDestino]
      : usuario.destinosCompletados,
  });
}