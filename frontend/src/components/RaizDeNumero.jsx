import { useState } from 'react';

/**
 * Atajo para calcular la raíz k-ésima de un número.
 *
 * Buscar ᵏ√N es resolver x^k − N = 0. La g(x) que se propone es la iteración
 * clásica ((k−1)·x + N/x^(k−1))/k, que es justo lo que hace Newton sobre esa
 * misma ecuación, así que converge muy rápido.
 */
export default function RaizDeNumero({ onAplicar }) {
  const [abierta, setAbierta] = useState(false);
  const [n, setN] = useState('2');
  const [k, setK] = useState('2');

  const numeroN = Number(n);
  const numeroK = Number(k);
  const valido =
    Number.isFinite(numeroN)
    && Number.isFinite(numeroK)
    && Number.isInteger(numeroK)
    && numeroK >= 2
    && numeroN > 0;

  const expresionF = `x^${k} - ${n}`;
  const expresionG =
    numeroK === 2 ? `(x + ${n}/x)/2` : `(${numeroK - 1}x + ${n}/x^${numeroK - 1})/${numeroK}`;
  const aproximada = valido ? Math.pow(numeroN, 1 / numeroK) : null;

  const aplicar = () => {
    if (!valido) return;
    const arranque = String(Math.max(1, Math.round(aproximada)));
    onAplicar({
      funcion: expresionF,
      g: expresionG,
      a: '0.1',
      b: String(Math.ceil(aproximada) + 1),
      x0: arranque,
      x1: String(Number(arranque) + 1),
      x2: String(Math.max(0.5, Number(arranque) - 0.5)),
      derivada: '',
      usarDerivadaManual: false,
    });
  };

  return (
    <section className="plegable">
      <button
        type="button"
        className="plegable-cabeza"
        aria-expanded={abierta}
        onClick={() => setAbierta(!abierta)}
      >
        <span aria-hidden="true">{abierta ? '−' : '+'}</span>
        Raíz de un número
      </button>

      {abierta && (
        <div className="plegable-cuerpo">
          <p className="campo-ayuda">
            Calcular la raíz k-ésima de N es resolver x<sup>k</sup> − N = 0.
          </p>
          <div className="rejilla-dos">
            <div className="campo">
              <label className="campo-etiqueta" htmlFor="raiz-n">
                N
              </label>
              <input
                id="raiz-n"
                className="entrada entrada-mono"
                type="number"
                step="any"
                min="0"
                value={n}
                onChange={(e) => setN(e.target.value)}
              />
            </div>
            <div className="campo">
              <label className="campo-etiqueta" htmlFor="raiz-k">
                k (índice)
              </label>
              <input
                id="raiz-k"
                className="entrada entrada-mono"
                type="number"
                step="1"
                min="2"
                value={k}
                onChange={(e) => setK(e.target.value)}
              />
            </div>
          </div>

          {valido ? (
            <p className="campo-ayuda mono">
              f(x) = {expresionF}
              <br />
              g(x) = {expresionG}
              <br />
              valor exacto ≈ {aproximada.toFixed(10)}
            </p>
          ) : (
            <p className="campo-error">N tiene que ser positivo y k un entero de 2 en adelante.</p>
          )}

          <button type="button" className="boton" onClick={aplicar} disabled={!valido}>
            Usar esta ecuación
          </button>
        </div>
      )}
    </section>
  );
}
