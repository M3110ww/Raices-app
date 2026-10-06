import { TIPOS_ERROR, TOPE_ITERACIONES } from '../lib/metodos.js';
import { potenciaDiez } from '../lib/formato.js';

/** Tolerancia, tope de iteraciones y forma de medir el error. */
export default function CriterioParada({ datos, actualizar }) {
  const tolerancia = Math.pow(10, -datos.n);

  return (
    <fieldset className="grupo">
      <legend className="campo-etiqueta">Criterio de parada</legend>

      <div className="campo">
        <label className="campo-etiqueta" htmlFor="tolerancia">
          Tolerancia
        </label>
        <output className="salida-mono salida-grande" htmlFor="tolerancia">
          {potenciaDiez(-datos.n)} = {tolerancia.toFixed(datos.n)}
        </output>
        <input
          id="tolerancia"
          className="deslizador"
          type="range"
          min="1"
          max="14"
          step="1"
          value={datos.n}
          onChange={(e) => actualizar({ n: Number(e.target.value) })}
          aria-valuetext={`10 elevado a menos ${datos.n}`}
        />
      </div>

      <div className="rejilla-dos">
        <div className="campo">
          <label className="campo-etiqueta" htmlFor="max-iteraciones">
            Iteraciones máximas
          </label>
          <input
            id="max-iteraciones"
            className="entrada entrada-mono"
            type="number"
            min="1"
            max={TOPE_ITERACIONES}
            step="1"
            value={datos.maxIteraciones}
            onChange={(e) => actualizar({ maxIteraciones: e.target.value })}
          />
        </div>

        <div className="campo">
          <label className="campo-etiqueta" htmlFor="tipo-error">
            Tipo de error
          </label>
          <select
            id="tipo-error"
            className="entrada"
            value={datos.tipoError}
            onChange={(e) => actualizar({ tipoError: e.target.value })}
          >
            {TIPOS_ERROR.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>
    </fieldset>
  );
}
