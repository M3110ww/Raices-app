/**
 * Campo de texto para una expresión, con validación en vivo.
 *
 * El error no bloquea la escritura: solo se muestra debajo, para poder seguir
 * corrigiendo sin que el campo "pelee" con quien escribe.
 */
export default function CampoFuncion({
  id,
  etiqueta,
  valor,
  onCambiar,
  error,
  ayuda,
  placeholder,
}) {
  const idError = `${id}-error`;
  return (
    <div className="campo">
      <label className="campo-etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <input
        id={id}
        className={`entrada entrada-mono${error ? ' entrada-mal' : ''}`}
        type="text"
        value={valor}
        placeholder={placeholder}
        spellCheck="false"
        autoComplete="off"
        onChange={(e) => onCambiar(e.target.value)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? idError : undefined}
      />
      {error ? (
        <p className="campo-error" id={idError} role="alert">
          {error}
        </p>
      ) : (
        ayuda && <p className="campo-ayuda">{ayuda}</p>
      )}
    </div>
  );
}
