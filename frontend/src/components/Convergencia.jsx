import { potenciaDiez, sci } from '../lib/formato.js';

const ANCHO = 340;
const ALTO = 190;
const MARGEN = { arriba: 14, derecha: 12, abajo: 28, izquierda: 38 };

/**
 * Gráfica de convergencia: log₁₀ del error frente al número de iteración.
 *
 * En escala logarítmica un método de convergencia cuadrática (Newton,
 * Steffensen) se ve como una curva que cae cada vez más deprisa, mientras que
 * bisección baja en línea recta. La línea punteada es la tolerancia: el método
 * para en cuanto la cruza.
 */
export default function Convergencia({ resultado, paso, tolerancia, onIrAPaso }) {
  if (!resultado) {
    return (
      <section className="bloque convergencia convergencia-vacia" aria-label="Convergencia">
        <div className="bloque-cabeza">
          <h2>Convergencia</h2>
        </div>
        <p className="vacio">Aquí se verá cómo baja el error en cada iteración.</p>
      </section>
    );
  }

  const puntos = resultado.iteraciones
    .map((it) => ({ n: it.n, error: it.error }))
    .filter((p) => p.error !== null && p.error !== undefined && p.error > 0);

  if (puntos.length === 0) {
    return (
      <section className="bloque convergencia" aria-label="Convergencia">
        <div className="bloque-cabeza">
          <h2>Convergencia</h2>
        </div>
        <p className="vacio">Este cálculo no llegó a medir ningún error.</p>
      </section>
    );
  }

  const logTolerancia = Math.log10(tolerancia);
  const logs = puntos.map((p) => Math.log10(p.error));
  const yMax = Math.ceil(Math.max(...logs, logTolerancia));
  const yMin = Math.floor(Math.min(...logs, logTolerancia) - 0.5);
  const nMax = Math.max(2, resultado.iteraciones.length);

  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;

  const px = (n) => MARGEN.izquierda + ((n - 1) / (nMax - 1)) * anchoUtil;
  const py = (log) => MARGEN.arriba + ((yMax - log) / Math.max(1e-9, yMax - yMin)) * altoUtil;

  const visibles = puntos.filter((p) => p.n - 1 <= paso);
  const trazo = visibles.map((p) => `${px(p.n)},${py(Math.log10(p.error))}`).join(' ');

  // Unas pocas marcas de exponente, para no amontonar texto.
  const marcasY = [];
  const salto = Math.max(1, Math.ceil((yMax - yMin) / 5));
  for (let e = Math.ceil(yMin); e <= yMax; e += salto) {
    marcasY.push(e);
  }

  const marcasX = [1];
  if (nMax > 1) marcasX.push(nMax);
  if (nMax > 6) marcasX.splice(1, 0, Math.round(nMax / 2));

  return (
    <section className="bloque convergencia" aria-label="Convergencia">
      <div className="bloque-cabeza">
        <h2>Convergencia</h2>
        <span className="pista mono">error final {sci(resultado.errorFinal, 2)}</span>
      </div>

      <svg
        className="convergencia-svg"
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        role="img"
        aria-label={`Error por iteración, de 10 elevado a ${yMax} hasta 10 elevado a ${yMin}`}
      >
        {marcasY.map((e) => (
          <g key={`y${e}`}>
            <line
              className="conv-rejilla"
              x1={MARGEN.izquierda}
              y1={py(e)}
              x2={ANCHO - MARGEN.derecha}
              y2={py(e)}
            />
            <text className="conv-texto" x={MARGEN.izquierda - 5} y={py(e) + 3} textAnchor="end">
              {potenciaDiez(e)}
            </text>
          </g>
        ))}

        {marcasX.map((n) => (
          <text
            key={`x${n}`}
            className="conv-texto"
            x={px(n)}
            y={ALTO - MARGEN.abajo + 14}
            textAnchor="middle"
          >
            {n}
          </text>
        ))}

        <line
          className="conv-eje"
          x1={MARGEN.izquierda}
          y1={MARGEN.arriba}
          x2={MARGEN.izquierda}
          y2={ALTO - MARGEN.abajo}
        />
        <line
          className="conv-eje"
          x1={MARGEN.izquierda}
          y1={ALTO - MARGEN.abajo}
          x2={ANCHO - MARGEN.derecha}
          y2={ALTO - MARGEN.abajo}
        />

        <line
          className="conv-tolerancia"
          x1={MARGEN.izquierda}
          y1={py(logTolerancia)}
          x2={ANCHO - MARGEN.derecha}
          y2={py(logTolerancia)}
        />
        <text
          className="conv-texto conv-texto-tolerancia"
          x={ANCHO - MARGEN.derecha}
          y={py(logTolerancia) - 4}
          textAnchor="end"
        >
          tolerancia
        </text>

        {visibles.length > 1 && <polyline className="conv-trazo" points={trazo} />}

        {puntos.map((p) => {
          const visible = p.n - 1 <= paso;
          const esActual = p.n - 1 === paso;
          return (
            <circle
              key={p.n}
              className={`conv-punto${esActual ? ' conv-punto-actual' : ''}`}
              cx={px(p.n)}
              cy={py(Math.log10(p.error))}
              r={esActual ? 5 : 3.5}
              opacity={visible ? 1 : 0}
              role="button"
              tabIndex={visible ? 0 : -1}
              aria-label={`Iteración ${p.n}, error ${sci(p.error, 2)}`}
              onClick={() => onIrAPaso(p.n - 1)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onIrAPaso(p.n - 1);
                }
              }}
            />
          );
        })}
      </svg>

      <p className="campo-ayuda">Haz clic en un punto para ir a esa iteración.</p>
    </section>
  );
}
