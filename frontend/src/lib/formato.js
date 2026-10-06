/** Formateo de números para la tabla, el cajetín y las etiquetas de la gráfica. */

const SUPERINDICES = {
  0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴',
  5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹',
  '-': '⁻', '+': '⁺',
};

/** Convierte "-6" en "⁻⁶" usando superíndices Unicode de verdad. */
export function superindice(n) {
  return String(n)
    .split('')
    .map((c) => SUPERINDICES[c] ?? c)
    .join('');
}

/** Escribe una potencia de diez con superíndices: potenciaDiez(-6) → "10⁻⁶". */
export function potenciaDiez(n) {
  return `10${superindice(n)}`;
}

/** Subíndices Unicode para las etiquetas x₀, x₁… del dibujo. */
const SUBINDICES = {
  0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄',
  5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉',
};

/** Convierte "12" en "₁₂". */
export function subindice(n) {
  return String(n)
    .split('')
    .map((c) => SUBINDICES[c] ?? c)
    .join('');
}

/**
 * Número con un número fijo de decimales.
 *
 * Los valores que no son finitos se muestran como raya, igual que los null que
 * llegan del servidor. Cuando la magnitud se sale de lo razonable se cambia a
 * notación científica para que la columna no se desborde.
 */
export function num(v, decimales = 6) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  if (v === 0) return (0).toFixed(decimales);
  const magnitud = Math.abs(v);
  if (magnitud >= 1e9 || magnitud < 1e-9) {
    return v.toExponential(Math.min(decimales, 9));
  }
  return v.toFixed(decimales);
}

/** Notación científica compacta con el ×10ⁿ escrito de verdad: 5.82×10⁻¹¹. */
export function sci(v, decimales = 2) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const texto = v.toExponential(decimales);
  const [mantisa, exponente] = texto.split('e');
  const n = Number(exponente);
  if (n === 0) return mantisa;
  return `${mantisa}×10${superindice(n)}`;
}

/** Número corto para los ejes de la gráfica, sin ceros de relleno. */
export function ejeLabel(v, paso) {
  if (v === 0) return '0';
  const magnitud = Math.abs(v);
  if (magnitud >= 1e6 || magnitud < 1e-4) return sci(v, 1);
  // Tantos decimales como pida el paso de la rejilla.
  const decimales = Math.max(0, Math.min(8, -Math.floor(Math.log10(paso))));
  return v.toFixed(decimales);
}

/**
 * Tabla de iteraciones en CSV.
 *
 * Mismas columnas que la tabla de la pantalla (n, las del método y el error) y
 * los números con toda su precisión, para poder seguir trabajando en una hoja
 * de cálculo.
 */
export function csv(resultado) {
  if (!resultado) return '';
  const columnas = resultado.columnas ?? [];
  const cabecera = ['n', ...columnas.map((c) => c.etiqueta), 'error'];
  const celda = (v) => (v === null || v === undefined ? '' : String(v));

  const filas = resultado.iteraciones.map((it) => [
    it.n,
    ...columnas.map((c) => celda(it.valores?.[c.clave])),
    celda(it.error),
  ]);

  const escapar = (v) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  return [cabecera, ...filas].map((fila) => fila.map(escapar).join(',')).join('\n');
}

/** Dispara la descarga de un texto como archivo. */
export function descargar(nombre, texto, tipo = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿', texto], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
