const VELOCIDADES = [0.5, 1, 2, 4];

/** Controles para recorrer las iteraciones como si fueran fotogramas. */
export default function Reproductor({
  total,
  paso,
  reproduciendo,
  velocidad,
  acercar,
  onPaso,
  onAlternar,
  onVelocidad,
  onAcercar,
}) {
  const activo = total > 0;
  const actual = activo ? paso + 1 : 0;

  return (
    <section className="bloque reproductor" aria-label="Reproductor de iteraciones">
      <div className="reproductor-botones" role="group" aria-label="Control de la reproducción">
        <button
          type="button"
          className="boton boton-icono"
          onClick={() => onPaso(0)}
          disabled={!activo}
          aria-label="Ir al primer paso"
          title="Primer paso"
        >
          <span aria-hidden="true">|&#9664;</span>
        </button>
        <button
          type="button"
          className="boton boton-icono"
          onClick={() => onPaso(paso - 1)}
          disabled={!activo || paso <= 0}
          aria-label="Paso anterior"
          title="Paso anterior"
        >
          <span aria-hidden="true">&#9664;</span>
        </button>
        <button
          type="button"
          className="boton boton-icono boton-play"
          onClick={onAlternar}
          disabled={!activo}
          aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
          title={reproduciendo ? 'Pausar (espacio)' : 'Reproducir (espacio)'}
        >
          <span aria-hidden="true">{reproduciendo ? '‖' : '▶'}</span>
        </button>
        <button
          type="button"
          className="boton boton-icono"
          onClick={() => onPaso(paso + 1)}
          disabled={!activo || paso >= total - 1}
          aria-label="Paso siguiente"
          title="Paso siguiente"
        >
          <span aria-hidden="true">&#9654;</span>
        </button>
        <button
          type="button"
          className="boton boton-icono"
          onClick={() => onPaso(total - 1)}
          disabled={!activo}
          aria-label="Ir al último paso"
          title="Último paso"
        >
          <span aria-hidden="true">&#9654;|</span>
        </button>
      </div>

      <div className="reproductor-barra">
        <label className="pista" htmlFor="paso-actual">
          Paso
        </label>
        <input
          id="paso-actual"
          className="deslizador"
          type="range"
          min="1"
          max={Math.max(1, total)}
          step="1"
          value={Math.max(1, actual)}
          disabled={!activo}
          onChange={(e) => onPaso(Number(e.target.value) - 1)}
          aria-valuetext={`paso ${actual} de ${total}`}
        />
        <output className="mono reproductor-cuenta">
          {actual} / {total}
        </output>
      </div>

      <div className="reproductor-opciones">
        <div className="segmentado segmentado-pequeno" role="group" aria-label="Velocidad">
          {VELOCIDADES.map((v) => (
            <button
              key={v}
              type="button"
              className={`segmento${v === velocidad ? ' segmento-activo' : ''}`}
              onClick={() => onVelocidad(v)}
              aria-pressed={v === velocidad}
            >
              {v}&times;
            </button>
          ))}
        </div>

        <label className="casilla">
          <input
            type="checkbox"
            checked={acercar}
            onChange={(e) => onAcercar(e.target.checked)}
          />
          Acercar en cada paso
        </label>
      </div>
    </section>
  );
}
