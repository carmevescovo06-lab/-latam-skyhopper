import DestinoCard from '../components/destinocard.jsx';
import destinosData from '../data/destinos.js';
import { estaBloqueado } from '../data/progreso.js';

function Destinos() {
  return (
    <section className="destinos">
      <header className="destinos__encabezado">
        <p className="destinos__etiqueta">RUTA GLOBAL</p>
        <h2 className="destinos__titulo">Destinos</h2>
        <p className="destinos__subtitulo">
          Elegí tu próximo destino y seguí sumando millas.
        </p>
      </header>

      <div className="destinos__grid">
     {destinosData.map((destino) => (
  <DestinoCard
    key={destino.id}
    destino={{ ...destino, bloqueado: estaBloqueado(destino.id) }}
  />
))}
      </div>
    </section>
  );
}

export default Destinos;

