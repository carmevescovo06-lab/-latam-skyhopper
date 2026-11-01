// Lista de avatares que puede elegir cada piloto.
// Cada avatar es un círculo de color con un emoji adentro.
// Si más adelante tenés imágenes propias, agregá un campo "imagen" así:
//   { id: 'piloto', nombre: 'Piloto', emoji: '🧑‍✈️', color: '#1B0088', imagen: '/imagenes/avatares/piloto.png' }
// y el componente Avatar va a mostrar la imagen en lugar del emoji.

export const AVATARES = [
  { id: 'piloto', nombre: 'Piloto', emoji: '🧑‍✈️', color: '#1B0088' },
  { id: 'copiloto', nombre: 'Copiloto', emoji: '👩‍✈️', color: '#EB0045' },
  { id: 'astronauta', nombre: 'Astronauta', emoji: '🧑‍🚀', color: '#007CE0' },
  { id: 'avion', nombre: 'Avión', emoji: '✈️', color: '#2a2f8f' },
  { id: 'cohete', nombre: 'Cohete', emoji: '🚀', color: '#a0113a' },
  { id: 'mundo', nombre: 'Mundo', emoji: '🌎', color: '#0b5a99' },
  { id: 'condor', nombre: 'Cóndor', emoji: '🦅', color: '#4a3b8f' },
  { id: 'nube', nombre: 'Nube', emoji: '⛅', color: '#3b6a99' },
];

// Busca un avatar por su id. Si no lo encuentra, devuelve el primero.
export function obtenerAvatar(id) {
  return AVATARES.find((a) => a.id === id) || AVATARES[0];
}