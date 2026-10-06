import { METODOS } from '../lib/metodos.js';

/** Lista de métodos con radios estilizados, su etiqueta y su descripción. */
export default function SelectorMetodo({ valor, onCambiar }) {
  const elegido = METODOS.find((m) => m.id === valor) ?? METODOS[0];

  return (
    <fieldset className="grupo">
      <legend className="campo-etiqueta">Método</legend>
      <div className="metodos">
        {METODOS.map((m) => (
          <label key={m.id} className={`metodo${m.id === valor ? ' metodo-activo' : ''}`}>
            <input
              type="radio"
              name="metodo"
              value={m.id}
              checked={m.id === valor}
              onChange={() => onCambiar(m.id)}
            />
            <span className="metodo-marca" aria-hidden="true" />
            <span className="metodo-nombre">{m.nombre}</span>
          </label>
        ))}
      </div>
      <p className="campo-ayuda">{elegido.descripcion}</p>
    </fieldset>
  );
}
