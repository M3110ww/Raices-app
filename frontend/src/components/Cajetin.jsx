import { num, sci } from '../lib/formato.js';

/**
 * Cajetín de resultado, con el aspecto del rótulo de un plano técnico: una
 * rejilla de celdas con bordes de tinta y la raíz en grande.
 */
export default function Cajetin({ resultado, funcion, iteracion, decimales }) {
  if (!resultado) {
    return (
      <section className="bloque cajetin cajetin-vacio" aria-label="Resultado">
        <div className="bloque-cabeza">
          <h2>Resultado</h2>
        </div>
        <p className="vacio">
          Elige un método y pulsa <strong>Calcular raíz</strong>.
        </p>
      </section>
    );
  }

  const celdas = [
    { titulo: 'Método', valor: resultado.nombreMetodo },
    { titulo: 'f(x)', valor: funcion, mono: true },
    { titulo: 'f(raíz)', valor: sci(resultado.fRaiz, 3), mono: true },
    { titulo: 'Error final', valor: sci(resultado.errorFinal, 3), mono: true },
    { titulo: 'Iteraciones', valor: String(resultado.iteracionesRealizadas), mono: true },
    { titulo: 'Tiempo', valor: `${resultado.tiempoMs} ms`, mono: true },
  ];

  return (
    <section className="bloque cajetin" aria-label="Resultado">
      <div className="bloque-cabeza">
        <h2>Resultado</h2>
        {iteracion && (
          <span className="pista mono">
            paso {iteracion.n}: x = {num(iteracion.x, Math.min(decimales, 10))}
          </span>
        )}
      </div>

      <div className="cajetin-raiz">
        <span className="cajetin-raiz-titulo">Raíz aproximada</span>
        <output className="cajetin-raiz-valor mono">{num(resultado.raiz, decimales)}</output>
      </div>

      <dl className="cajetin-rejilla">
        {celdas.map((celda) => (
          <div className="cajetin-celda" key={celda.titulo}>
            <dt>{celda.titulo}</dt>
            <dd className={celda.mono ? 'mono' : undefined}>{celda.valor}</dd>
          </div>
        ))}
      </dl>

      <p className={`cajetin-mensaje ${resultado.convergio ? 'es-bien' : 'es-mal'}`} role="status">
        <span className="cajetin-marca" aria-hidden="true">
          {resultado.convergio ? '✓' : '!'}
        </span>
        {resultado.mensaje}
      </p>
    </section>
  );
}
