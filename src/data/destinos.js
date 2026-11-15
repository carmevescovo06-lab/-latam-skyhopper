const destinosData = [
  {
    id: 1,
    nombre: 'Argentina',
    imagen: '/imagenes/argentina.jpg',
    fondoJuego: '/imagenes/fondo-argentina.jpg',
    bloqueado: false,
    meta: 100,
    // Dificultad del vuelo (la leen el juego y la pantalla de detalle)
    dificultad: {
      nivel: 1, // estrellas, de 1 a 5
      desafio: 'Cielo despejado',
      descripcion: 'Un vuelo tranquilo para aprender los controles: sin viento ni niebla.',
      velocidad: 3.2,   // qué rápido avanzan los obstáculos
      hueco: 210,       // espacio para pasar (más chico = más difícil)
      separacion: 330,  // distancia entre obstáculos
      gravedad: 0.34,   // qué rápido cae el avión
      turbulencia: 0,   // 0 a 1: fuerza de las sacudidas
      niebla: 0,        // 0 a 1: cuánto tapa la niebla
    },
    detalle: {
      ciudad: 'Buenos Aires',
      ubicacion: 'Argentina, Sudamérica',
      xp: 300,
      elevacion: '67 ft',
      pista: '10,827 ft',
      horaLocal: '14:45 ART',
      clima: '22°C',
      titulo: 'La Reina del Plata',
      descripcion:
        'Capital cultural de Sudamérica, Buenos Aires combina arquitectura de estilo europeo, teatros legendarios, cafés históricos y el tango como símbolo de identidad. Sus barrios, cada uno con carácter propio, la convierten en una ciudad que se camina, se escucha y se saborea.',
      duracionVideo: '02:10',
      sabiasQue:
        'La Avenida 9 de Julio es una de las más anchas del mundo: en algunos tramos supera los 100 metros de ancho y cruza el corazón de la ciudad.',
      puntos: [
        { nombre: 'Obelisco', descripcion: 'Ícono de la ciudad, en el cruce de la 9 de Julio y Corrientes.' },
        { nombre: 'Caminito', descripcion: 'Calle-museo de casas coloridas en el barrio de La Boca.' },
        { nombre: 'Teatro Colón', descripcion: 'Uno de los teatros de ópera más importantes del mundo.' },
      ],
      ruta: { origen: 'SCL', destino: 'EZE', ciudadOrigen: 'Santiago de Chile' },
    },
  },
  {
    id: 2,
    nombre: 'Brasil',
    imagen: '/imagenes/brasil.jpeg',
    fondoJuego: '/imagenes/fondo-brasil.jpg',
    bloqueado: false,
    meta: 200,
    dificultad: {
      nivel: 2,
      desafio: 'Viento costero',
      descripcion: 'Ráfagas suaves del Atlántico te empujan hacia arriba o hacia abajo.',
      velocidad: 3.5,
      hueco: 200,
      separacion: 320,
      gravedad: 0.34,
      turbulencia: 0.3,
      niebla: 0,
    },
    detalle: {
      ciudad: 'Río de Janeiro',
      ubicacion: 'Brasil, Sudamérica',
      xp: 500,
      elevacion: '2,329 ft',
      pista: '13,123 ft',
      horaLocal: '14:45 BRT',
      clima: '28°C',
      titulo: 'La Ciudad Maravillosa',
      descripcion:
        'Famosa por su paisaje impresionante, su cultura de playa relajada y su carnaval anual, Río de Janeiro es una ciudad de contrastes. Ubicada entre las montañas y el mar, ofrece vistas increíbles desde casi cualquier ángulo, lo que la convierte en una favorita de los pilotos de todo el mundo.',
      duracionVideo: '02:45',
      sabiasQue:
        'La aproximación al aeropuerto Santos Dumont (SDU) se considera una de las más desafiantes y escénicas del mundo: exige un giro cerrado junto al Pan de Azúcar justo antes del aterrizaje.',
      puntos: [
        { nombre: 'Pan de Azúcar', descripcion: 'Pico icónico en la entrada de la bahía de Guanabara.' },
        { nombre: 'Cristo Redentor', descripcion: 'Estatua Art Déco en la cima del Corcovado.' },
        { nombre: 'Playa de Copacabana', descripcion: 'Famosa playa de 4 km.' },
      ],
      ruta: { origen: 'JFK', destino: 'SDU', ciudadOrigen: 'Nueva York' },
    },
  },
  {
    id: 3,
    nombre: 'México',
    imagen: '/imagenes/mexico.jpeg',
    fondoJuego: '/imagenes/fondo-mexico.jpg',
    bloqueado: false,
    meta: 250,
    dificultad: {
      nivel: 3,
      desafio: 'Aire de altura',
      descripcion: 'La ciudad está a más de 2.000 metros: el aire es más fino y el avión cae más rápido.',
      velocidad: 3.8,
      hueco: 190,
      separacion: 310,
      gravedad: 0.38,
      turbulencia: 0,
      niebla: 0,
    },
    detalle: {
      ciudad: 'Ciudad de México',
      ubicacion: 'México, Norteamérica',
      xp: 700,
      elevacion: '7,316 ft',
      pista: '12,966 ft',
      horaLocal: '11:45 CST',
      clima: '24°C',
      titulo: 'La Capital de las Mil Culturas',
      descripcion:
        'Una de las ciudades más grandes del mundo, la Ciudad de México mezcla herencia azteca, arquitectura colonial y una escena gastronómica y artística vibrante. Aterrizar acá es hacerlo a más de 2.000 metros de altura, en un valle rodeado de volcanes.',
      duracionVideo: '02:30',
      sabiasQue:
        'La ciudad está construida sobre el antiguo lago de Texcoco, donde se levantaba Tenochtitlan, la capital del imperio azteca.',
      puntos: [
        { nombre: 'Zócalo', descripcion: 'Plaza central de la ciudad, rodeada de la Catedral y el Palacio Nacional.' },
        { nombre: 'Teotihuacán', descripcion: 'Zona arqueológica con las pirámides del Sol y de la Luna, a las afueras.' },
        { nombre: 'Bosque de Chapultepec', descripcion: 'Gran parque urbano con museos y un castillo en lo alto.' },
      ],
      ruta: { origen: 'LIM', destino: 'MEX', ciudadOrigen: 'Lima' },
    },
  },
  {
    id: 4,
    nombre: 'España',
    imagen: '/imagenes/espana.jpg',
    fondoJuego: '/imagenes/fondo-espana.jpg',
    bloqueado: true,
    meta: 300,
    dificultad: {
      nivel: 4,
      desafio: 'Turbulencia',
      descripcion: 'Corrientes de aire sobre la meseta sacuden el avión con fuerza.',
      velocidad: 4.1,
      hueco: 180,
      separacion: 300,
      gravedad: 0.34,
      turbulencia: 0.7,
      niebla: 0,
    },
    detalle: {
      ciudad: 'Madrid',
      ubicacion: 'España, Europa',
      xp: 900,
      elevacion: '2,001 ft',
      pista: '13,451 ft',
      horaLocal: '19:45 CEST',
      clima: '19°C',
      titulo: 'La Villa y Corte',
      descripcion:
        'Capital de España y una de las ciudades con más vida nocturna y cultural de Europa. Madrid reúne grandes museos, plazas históricas, mercados y una tradición de tapas que se disfruta caminando de bar en bar.',
      duracionVideo: '02:20',
      sabiasQue:
        'Madrid es una de las capitales más altas de Europa: se encuentra a unos 650 metros sobre el nivel del mar.',
      puntos: [
        { nombre: 'Palacio Real', descripcion: 'Residencia oficial de la Corona española, una de las más grandes de Europa.' },
        { nombre: 'Museo del Prado', descripcion: 'Una de las pinacotecas más importantes del mundo.' },
        { nombre: 'Plaza Mayor', descripcion: 'Plaza porticada del siglo XVII en el centro histórico.' },
      ],
      ruta: { origen: 'GRU', destino: 'MAD', ciudadOrigen: 'São Paulo' },
    },
  },
  {
    id: 5,
    nombre: 'Japón',
    imagen: '/imagenes/japon.webp',
    fondoJuego: '/imagenes/fondo-tokio.jpg',
    bloqueado: true,
    meta: 400,
    dificultad: {
      nivel: 5,
      desafio: 'Niebla y turbulencia',
      descripcion: 'La niebla esconde los obstáculos hasta que están cerca, y las sacudidas no dan respiro.',
      velocidad: 4.5,
      hueco: 170,
      separacion: 290,
      gravedad: 0.34,
      turbulencia: 0.6,
      niebla: 0.8,
    },
    detalle: {
      ciudad: 'Tokio',
      ubicacion: 'Japón, Asia',
      xp: 1200,
      elevacion: '141 ft',
      pista: '13,123 ft',
      horaLocal: '02:45 JST',
      clima: '20°C',
      titulo: 'La Capital del Sol Naciente',
      descripcion:
        'Tokio combina rascacielos luminosos, templos centenarios y una precisión casi obsesiva en todo lo que hace. Es una de las ciudades más grandes del planeta y, aun así, cada barrio conserva su propio ritmo y su propia identidad.',
      duracionVideo: '03:00',
      sabiasQue:
        'El área metropolitana de Tokio es una de las más pobladas del mundo, con más de 35 millones de habitantes.',
      puntos: [
        { nombre: 'Templo Senso-ji', descripcion: 'El templo budista más antiguo de la ciudad, en el barrio de Asakusa.' },
        { nombre: 'Cruce de Shibuya', descripcion: 'Uno de los cruces peatonales más concurridos del mundo.' },
        { nombre: 'Santuario Meiji', descripcion: 'Santuario sintoísta rodeado de bosque en pleno centro.' },
      ],
      ruta: { origen: 'LAX', destino: 'NRT', ciudadOrigen: 'Los Ángeles' },
    },
  },
];

export default destinosData;