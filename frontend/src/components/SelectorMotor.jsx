import { API_URL, hayServidor } from '../lib/api.js';

const TEXTOS = {
  'sin-configurar': { texto: 'Sin configurar', clase: 'apagado' },
  conectando: { texto: 'Conectando…', clase: 'esperando' },
  conectado: { texto: 'Java conectado', clase: 'bien' },
  caido: { texto: 'Servidor caído', clase: 'mal' },
};

/** Elige dónde se calcula y muestra en qué estado está el servidor. */
export default function SelectorMotor({ motor, onMotor, estado, onReintentar }) {
  const info = TEXTOS[estado] ?? TEXTOS['sin-configurar'];
  const disponible = hayServidor();

  return (
    <fieldset className="grupo">
      <legend className="campo-etiqueta">Dónde se calcula</legend>

      <div className="segmentado" role="group" aria-label="Motor de cálculo">
        <button
          type="button"
          className={`segmento${motor === 'java' ? ' segmento-activo' : ''}`}
          onClick={() => onMotor('java')}
          disabled={!disponible}
          aria-pressed={motor === 'java'}
          title={disponible ? API_URL : 'Define VITE_API_URL para usar el servidor Java'}
        >
          Java (servidor)
        </button>
        <button
          type="button"
          className={`segmento${motor === 'navegador' ? ' segmento-activo' : ''}`}
          onClick={() => onMotor('navegador')}
          aria-pressed={motor === 'navegador'}
        >
          Navegador
        </button>
      </div>

      <p className={`estado estado-${info.clase}`}>
        <span className="estado-punto" aria-hidden="true" />
        {info.texto}
        {disponible && estado !== 'conectando' && (
          <button type="button" className="enlace" onClick={onReintentar}>
            reintentar
          </button>
        )}
      </p>

      {!disponible && (
        <p className="campo-ayuda">
          Sin VITE_API_URL todo se calcula en el navegador con el mismo algoritmo.
        </p>
      )}
    </fieldset>
  );
}
