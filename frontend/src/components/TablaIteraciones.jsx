import { csv, descargar, num } from '../lib/formato.js';

/**
 * Tabla de iteraciones.
 *
 * Las columnas las declara cada método, así que esta tabla no sabe nada de
 * bisección ni de Newton: solo recorre `resultado.columnas`.
 */
export default function TablaIteraciones({ resultado, paso, decimales, onDecimales, onIrAPaso }) {
  if (!resultado) {
    return (
      <section className="bloque tabla-bloque" aria-label="Tabla de iteraciones">
        <div className="bloque-cabeza">
          <h2>Iteraciones</h2>
        </div>
        <p className="vacio">La tabla se llenará con el detalle de cada paso.</p>
      </section>
    );
  }

  const columnas = resultado.columnas ?? [];

  return (
    <section className="bloque tabla-bloque" aria-label="Tabla de iteraciones">
      <div className="bloque-cabeza">
        <h2>Iteraciones</h2>
        <div className="bloque-acciones">
          <label className="pista" htmlFor="decimales">
            Decimales
          </label>
          <select
            id="decimales"
            className="entrada entrada-estrecha"
            value={decimales}
            onChange={(e) => onDecimales(Number(e.target.value))}
          >
            {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="boton boton-secundario"
            onClick={() => descargar(`iteraciones-${resultado.metodo}.csv`, csv(resultado))}
          >
            Descargar CSV
          </button>
        </div>
      </div>

      <div className="tabla-marco">
        <table className="tabla">
          <caption className="oculto">
            Iteraciones del método {resultado.nombreMetodo}. Haz clic en una fila para ir a ese
            paso.
          </caption>
          <thead>
            <tr>
              <th scope="col">n</th>
              {columnas.map((columna) => (
                <th scope="col" key={columna.clave}>
                  {columna.etiqueta}
                </th>
              ))}
              <th scope="col">error</th>
            </tr>
          </thead>
          <tbody>
            {resultado.iteraciones.map((it) => {
              const esActual = it.n - 1 === paso;
              const esFutura = it.n - 1 > paso;
              return (
                <tr
                  key={it.n}
                  className={`${esActual ? 'fila-actual' : ''}${esFutura ? ' fila-futura' : ''}`}
                  aria-current={esActual ? 'true' : undefined}
                  tabIndex={0}
                  onClick={() => onIrAPaso(it.n - 1)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onIrAPaso(it.n - 1);
                    }
                  }}
                >
                  <th scope="row">{it.n}</th>
                  {columnas.map((columna) => (
                    <td key={columna.clave}>{num(it.valores?.[columna.clave], decimales)}</td>
                  ))}
                  <td>{num(it.error, decimales)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
