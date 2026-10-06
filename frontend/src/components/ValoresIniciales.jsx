import CampoFuncion from './CampoFuncion.jsx';
import { esCerrado } from '../lib/metodos.js';

const ETIQUETAS = {
  a: 'a (extremo izquierdo)',
  b: 'b (extremo derecho)',
  x0: 'x₀',
  x1: 'x₁',
  x2: 'x₂',
};

/**
 * Muestra solo los valores iniciales que pide el método elegido, más lo que
 * cada uno necesita aparte: g(x) en punto fijo y f′(x) en Newton.
 */
export default function ValoresIniciales({
  datos,
  actualizar,
  metodo,
  errorG,
  derivadaAuto,
  avisoDerivada,
  onBuscarCambioDeSigno,
}) {
  const numeros = metodo.requiere.filter((clave) => clave !== 'g');

  return (
    <div className="grupo">
      <span className="campo-etiqueta">Valores iniciales</span>

      <div className={numeros.length > 1 ? 'rejilla-dos' : ''}>
        {numeros.map((clave) => (
          <div className="campo" key={clave}>
            <label className="campo-etiqueta" htmlFor={`valor-${clave}`}>
              {ETIQUETAS[clave]}
            </label>
            <input
              id={`valor-${clave}`}
              className="entrada entrada-mono"
              type="number"
              step="any"
              value={datos[clave]}
              onChange={(e) => actualizar({ [clave]: e.target.value })}
            />
          </div>
        ))}
      </div>

      {esCerrado(metodo) && (
        <button type="button" className="boton boton-secundario" onClick={onBuscarCambioDeSigno}>
          Buscar cambio de signo en la vista
        </button>
      )}

      {metodo.requiere.includes('g') && (
        <CampoFuncion
          id="campo-g"
          etiqueta="g(x) ="
          valor={datos.g}
          onCambiar={(valor) => actualizar({ g: valor })}
          error={errorG}
          ayuda="La ecuación reescrita como x = g(x). Converge si |g′(x)| < 1 cerca de la raíz."
        />
      )}

      {metodo.id === 'newton' && (
        <div className="grupo-derivada">
          <div className="campo">
            <span className="campo-etiqueta">f′(x)</span>
            {datos.usarDerivadaManual ? (
              <input
                className="entrada entrada-mono"
                type="text"
                spellCheck="false"
                autoComplete="off"
                value={datos.derivada}
                placeholder="por ejemplo 3x^2 - 1"
                onChange={(e) => actualizar({ derivada: e.target.value })}
                aria-label="Derivada escrita a mano"
              />
            ) : (
              <output className="salida-mono">{derivadaAuto ?? 'calculando…'}</output>
            )}
          </div>

          <label className="casilla">
            <input
              type="checkbox"
              checked={datos.usarDerivadaManual}
              onChange={(e) =>
                actualizar({
                  usarDerivadaManual: e.target.checked,
                  derivada: e.target.checked ? (derivadaAuto ?? datos.derivada) : datos.derivada,
                })
              }
            />
            Escribir la derivada a mano
          </label>

          {avisoDerivada && !datos.usarDerivadaManual && (
            <p className="campo-ayuda">{avisoDerivada}</p>
          )}
        </div>
      )}
    </div>
  );
}
