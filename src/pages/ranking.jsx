import { useEffect, useState } from 'react';
import Avatar from '../components/avatar.jsx';
import { armarRanking, calcularTier } from '../data/usuarios.js';
import './pantallas.css';

// Premios del ranking (el puesto decide cuál te toca)
const BENEFICIOS = [
  { titulo: 'Puesto 1', texto: 'Upgrade gratuito a Primera Clase en tu próximo vuelo reservado.' },
  { titulo: 'Puestos 2 a 5', texto: '20% de descuento en la tarifa base de rutas nacionales.' },
  { titulo: 'Puestos 6 a 10', texto: 'Embarque prioritario gratis y equipaje extra.' },
];

// Qué premio le toca a un puesto (0, 1 o 2). Si está fuera del top 10: null
function indiceBeneficio(puesto) {
  if (puesto === 1) return 0;
  if (puesto <= 5) return 1;
  if (puesto <= 10) return 2;
  return null;
}

// Cuánto falta para que termine el mes (el "ciclo" del ranking)
function tiempoHastaFinDeMes() {
  const ahora = new Date();
  const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
  const minutosTotales = Math.max(0, Math.floor((fin - ahora) / 60000));
  const dias = Math.floor(minutosTotales / 1440);
  const horas = Math.floor((minutosTotales % 1440) / 60);
  const minutos = minutosTotales % 60;
  return `${dias}d ${horas}h ${minutos}m`;
}

function Ranking({ usuario }) {
  const [cuentaRegresiva, setCuentaRegresiva] = useState(tiempoHastaFinDeMes);

  // Este número sube cuando otra pestaña guarda algo. No lo mostramos:
  // solo sirve para que React vuelva a dibujar la pantalla y relea el ranking.
  const [, setActualizacion] = useState(0);

  // Actualiza la cuenta regresiva una vez por minuto
  useEffect(() => {
    const intervalo = setInterval(() => {
      setCuentaRegresiva(tiempoHastaFinDeMes());
    }, 60000);
    return () => clearInterval(intervalo);
  }, []);

  // Si otra pestaña del juego cambia el localStorage, el navegador avisa con
  // el evento "storage" y volvemos a dibujar el ranking con los datos nuevos.
  useEffect(() => {
    function alCambiarAlmacenamiento() {
      setActualizacion((n) => n + 1);
    }
    window.addEventListener('storage', alCambiarAlmacenamiento);
    return () => window.removeEventListener('storage', alCambiarAlmacenamiento);
  }, []);

  // Todos los pilotos reales de este navegador, ordenados por millas
  const ranking = armarRanking();
  const top10 = ranking.slice(0, 10);

  // Dónde estoy yo en la lista completa
  const miIndice = ranking.findIndex((p) => p.passengerId === usuario.passengerId);
  const miPuesto = miIndice + 1;
  const yo = ranking[miIndice];
  const pilotoDeArriba = miIndice > 0 ? ranking[miIndice - 1] : null;
  const beneficioMio = indiceBeneficio(miPuesto);

  // Para superar al de arriba hay que tener una milla más que él
  const millasQueFaltan = pilotoDeArriba ? pilotoDeArriba.millas - yo.millas + 1 : 0;
  const porcentaje = pilotoDeArriba
    ? Math.min(100, (yo.millas / Math.max(pilotoDeArriba.millas, 1)) * 100)
    : 100;

  return (
    <main className="pantalla">
      <p className="pantalla__etiqueta">Ranking mundial</p>
      <h1 className="pantalla__titulo">Ranking</h1>
      <p className="pantalla__subtitulo">
        Posiciones según las millas totales acumuladas. Los 10 mejores del mes reciben
        beneficios reales de la aerolínea.
      </p>

      <div className="ranking__contenido">
        {/* ----- Lista de pilotos ----- */}
        <section>
          <div className="ranking__lista">
            <div className="ranking__encabezado">
              <span>Puesto</span>
              <span>Piloto</span>
              <span>Millas</span>
              <span>Medallas</span>
            </div>

            {top10.map((p, i) => {
              const puesto = i + 1;
              const esYo = p.passengerId === usuario.passengerId;

              const clases = ['ranking__fila'];
              if (puesto <= 3) clases.push(`ranking__fila--top${puesto}`);
              if (esYo) clases.push('ranking__fila--yo');

              return (
                <div key={p.passengerId} className={clases.join(' ')}>
                  <span className="ranking__puesto">{puesto}</span>

                  <div className="ranking__piloto">
                    <Avatar id={p.avatar} tamano={44} />
                    <div style={{ minWidth: 0 }}>
                      <span className="ranking__nombre">
                        {p.userName}
                        {esYo ? ' (vos)' : ''}
                      </span>
                      <span className="ranking__tier">{calcularTier(p.millas).actual.nombre}</span>
                    </div>
                  </div>

                  <span className="ranking__millas">{p.millas.toLocaleString('es-AR')}</span>
                  <span className="ranking__medallas">🏅 {p.medallas}</span>
                </div>
              );
            })}
          </div>

          <p className="ranking__nota">
            Este ranking muestra a los pilotos que ingresaron en este dispositivo y se actualiza
            cada vez que alguien completa un vuelo.
          </p>

          {/* ----- Tu posición ----- */}
          <div className="ranking__yo">
            <div className="ranking__yo-puesto">
              <span>PUESTO</span>
              <strong>{miPuesto}</strong>
            </div>

            <div className="ranking__yo-info">
              <h3>{usuario.userName}</h3>
              <p>
                {pilotoDeArriba
                  ? `Te faltan ${millasQueFaltan.toLocaleString('es-AR')} millas para superar a ${pilotoDeArriba.userName}`
                  : '¡Estás en el primer puesto!'}
              </p>
              <div className="barra">
                <div className="barra__progreso" style={{ width: `${porcentaje}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* ----- Beneficios del mes ----- */}
        <aside className="tarjeta ranking__beneficios">
          <h2 className="tarjeta__titulo">Beneficios del mes</h2>
          <p>
            Los pilotos que se mantengan en el Top 10 al terminar el mes desbloquean beneficios
            exclusivos de la aerolínea.
          </p>

          {BENEFICIOS.map((b, i) => (
            <div
              key={b.titulo}
              className={`ranking__beneficio${beneficioMio === i ? ' ranking__beneficio--activo' : ''}`}
            >
              <strong>{b.titulo}</strong>
              <span>{b.texto}</span>
            </div>
          ))}

          <div className="ranking__ciclo">
            <span>El ciclo termina en</span>
            <strong>{cuentaRegresiva}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default Ranking;