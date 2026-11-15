import React from "react";
import "./bienvenida.css";

export default function Bienvenida({ onStart }) {
  return (
    <main className="bienvenida">

      {/* FONDO */}
      <div className="bienvenida-fondo"></div>
      <div className="bienvenida-overlay"></div>

      {/* CONTENIDO */}
      <section className="bienvenida-contenido">

        {/* ETIQUETA SUPERIOR */}
        <div className="bienvenida-etiqueta">
          <span className="punto-magenta"></span>
          LATAM AIRLINES · EXPERIENCIA INTERACTIVA
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="bienvenida-principal">

          <div className="bienvenida-titulo">

            <h1>
              Tu próximo
              <br />
              destino está
              <br />
              <span>a un vuelo.</span>
            </h1>

            <p className="bienvenida-descripcion">
              Prepará tu avión, tomá los controles y descubrí el mundo
              desde otra perspectiva. Tu aventura como piloto comienza acá.
            </p>

            <button
              className="boton-comenzar"
              onClick={onStart}
            >
              COMENZAR EXPERIENCIA
              <span>→</span>
            </button>

          </div>

        </div>

        {/* FOOTER */}
        <footer className="bienvenida-footer">
          <span>SKYHOPPER</span>
          <span>EXPLORÁ · VOLÁ · DESCUBRÍ</span>
          <span>LATAM AIRLINES</span>
        </footer>

      </section>

    </main>
  );
}