/**
 * Ejemplos listos para probar.
 *
 * Cada uno trae su propia g(x), su intervalo [a, b] y sus tres puntos
 * iniciales, elegidos para que el método que se escoja tenga datos sensatos sin
 * tocar nada más.
 */
export const EJEMPLOS = [
  {
    funcion: 'x^3 - x - 2',
    g: 'cbrt(x+2)',
    a: '1',
    b: '2',
    x0: '1',
    x1: '1.5',
    x2: '2',
    nota: 'raíz ≈ 1.5214',
  },
  {
    funcion: 'x^3 + 4x^2 - 10',
    g: 'sqrt(10/(x+4))',
    a: '1',
    b: '2',
    x0: '1.5',
    x1: '1',
    x2: '2',
    nota: 'raíz ≈ 1.3652',
  },
  {
    funcion: 'cos(x) - x',
    g: 'cos(x)',
    a: '0',
    b: '1',
    x0: '0',
    x1: '0.5',
    x2: '1',
    nota: 'raíz ≈ 0.7391',
  },
  {
    funcion: 'e^(-x) - x',
    g: 'e^(-x)',
    a: '0',
    b: '1',
    x0: '0.5',
    x1: '1',
    x2: '0',
    nota: 'raíz ≈ 0.5671',
  },
  {
    funcion: 'x sen(x) - 1',
    g: '1/sen(x)',
    a: '0.5',
    b: '2',
    x0: '1',
    x1: '2',
    x2: '0.5',
    nota: 'raíz ≈ 1.1142',
  },
  {
    funcion: 'ln(x) + x - 2',
    g: '2-ln(x)',
    a: '1',
    b: '2',
    x0: '1.5',
    x1: '2',
    x2: '1',
    nota: 'raíz ≈ 1.5571',
  },
];

export default function Ejemplos({ actual, onElegir }) {
  return (
    <div className="campo">
      <span className="campo-etiqueta" id="titulo-ejemplos">
        Ejemplos
      </span>
      <div className="chips" role="group" aria-labelledby="titulo-ejemplos">
        {EJEMPLOS.map((ejemplo) => (
          <button
            key={ejemplo.funcion}
            type="button"
            className={`chip${ejemplo.funcion === actual ? ' chip-activo' : ''}`}
            title={`${ejemplo.funcion} · g(x) = ${ejemplo.g} · ${ejemplo.nota}`}
            aria-pressed={ejemplo.funcion === actual}
            onClick={() =>
              onElegir({
                funcion: ejemplo.funcion,
                g: ejemplo.g,
                a: ejemplo.a,
                b: ejemplo.b,
                x0: ejemplo.x0,
                x1: ejemplo.x1,
                x2: ejemplo.x2,
                derivada: '',
                usarDerivadaManual: false,
              })
            }
          >
            {ejemplo.funcion}
          </button>
        ))}
      </div>
    </div>
  );
}
