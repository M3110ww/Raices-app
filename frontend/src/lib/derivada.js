/**
 * Derivada simbólica con mathjs.
 *
 * mathjs es la única dependencia pesada del proyecto y solo hace falta para
 * esto, así que se carga con import() dinámico: no entra en el paquete inicial
 * y solo se descarga cuando alguien elige Newton.
 */

/**
 * Traduce los alias en español a los nombres que entiende mathjs.
 *
 * Se usan límites de palabra para no estropear identificadores: en "sen(x)"
 * cambia "sen", pero en "asen" no tocaría nada.
 */
function haciaMathjs(texto) {
  return String(texto)
    .replace(/\*\*/g, '^')
    .replace(/\bsen\b/g, 'sin')
    .replace(/\btg\b/g, 'tan')
    .replace(/\bln\b/g, 'log'); // en mathjs log es el natural, igual que aquí
}

/** Deja la expresión como la escribiría una persona: sin espacios sueltos en "^". */
function compactar(texto) {
  return String(texto)
    .replace(/\s*\^\s*/g, '^')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcula f′(x) de forma simbólica.
 *
 * @param {string} funcion expresión de f(x)
 * @returns {Promise<{expr: string|null, error: string|null}>} la derivada ya
 *   simplificada, o el motivo por el que no se pudo obtener
 */
export async function derivadaSimbolica(funcion) {
  if (!funcion || String(funcion).trim() === '') {
    return { expr: null, error: 'Escribe primero f(x)' };
  }
  try {
    const { derivative, simplify } = await import('mathjs');
    const entrada = haciaMathjs(funcion);
    const derivada = derivative(entrada, 'x');
    let texto;
    try {
      texto = simplify(derivada).toString();
    } catch {
      // Si simplify se atasca, la derivada sin simplificar también sirve.
      texto = derivada.toString();
    }
    return { expr: compactar(texto), error: null };
  } catch (e) {
    return {
      expr: null,
      error: `No se pudo derivar esta función (${e.message}). Se usará la derivada numérica.`,
    };
  }
}
