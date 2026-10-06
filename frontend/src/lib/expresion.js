/**
 * Parser de expresiones matemáticas. Port exacto de
 * backend/src/main/java/com/analisis/raices/expresion/Expresion.java.
 *
 * Gramática (descenso recursivo):
 *
 *   expresion := termino (('+'|'-') termino)*
 *   termino   := unario (('*'|'/') unario | multiplicación implícita)*
 *   unario    := ('-'|'+') unario | potencia
 *   potencia  := primario ('^' unario)?        asociativa a la derecha
 *   primario  := número | función(args) | identificador | '(' expresion ')'
 *
 * Detalles que importan:
 *  - `**` es lo mismo que `^`, y los corchetes funcionan como paréntesis.
 *  - La notación científica solo se reconoce si después de la `e` viene un
 *    dígito (con signo opcional), así que `2e^x` se lee como 2·e^x.
 *  - Multiplicación implícita: `2x`, `3(x+1)`, `x sen(x)`.
 *  - Precedencia: `-x^2` es −(x²) y `2^-2` es 0.25.
 *
 * Si se cambia algo aquí, hay que cambiarlo igual en el archivo Java: los dos
 * motores tienen que dar el mismo resultado.
 */

/** Nombres de función reconocidos, con los alias en español. */
const FUNCIONES = new Set([
  'sin', 'sen', 'cos', 'tan', 'tg', 'sec', 'csc', 'cot', 'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh', 'exp', 'ln', 'log', 'log10', 'log2', 'sqrt', 'cbrt', 'abs',
]);

/** Error de sintaxis en la expresión escrita por la persona. */
export class ErrorExpresion extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorExpresion';
  }
}

const TIPO = {
  NUMERO: 'NUMERO',
  IDENT: 'IDENT',
  OPERADOR: 'OPERADOR',
  ABRE: 'ABRE',
  CIERRA: 'CIERRA',
  COMA: 'COMA',
  FIN: 'FIN',
};

/** Cambia por sus equivalentes los símbolos que suelen llegar copiados y pegados. */
function normalizar(s) {
  return s
    .replace(/−/g, '-') // signo menos tipográfico
    .replace(/–/g, '-') // raya corta
    .replace(/—/g, '-') // raya larga
    .replace(/×/g, '*') // signo por
    .replace(/·/g, '*') // punto medio
    .replace(/÷/g, '/') // signo dividido
    .replace(/⁄/g, '/'); // barra de fracción
}

function esDigito(c) {
  return c >= '0' && c <= '9';
}

function esLetra(c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
}

function esEspacio(c) {
  return /\s/.test(c);
}

function separarTokens(s) {
  const lista = [];
  let p = 0;
  while (p < s.length) {
    const c = s[p];

    if (esEspacio(c)) {
      p++;
      continue;
    }

    if (esDigito(c) || (c === '.' && p + 1 < s.length && esDigito(s[p + 1]))) {
      const ini = p;
      while (p < s.length && esDigito(s[p])) p++;
      if (p < s.length && s[p] === '.') {
        p++;
        while (p < s.length && esDigito(s[p])) p++;
      }
      // La 'e' solo abre un exponente si de verdad le sigue un número; si no,
      // es la constante de Euler y toca multiplicar de forma implícita.
      if (p < s.length && (s[p] === 'e' || s[p] === 'E')) {
        let q = p + 1;
        if (q < s.length && (s[q] === '+' || s[q] === '-')) q++;
        if (q < s.length && esDigito(s[q])) {
          p = q;
          while (p < s.length && esDigito(s[p])) p++;
        }
      }
      const txt = s.slice(ini, p);
      const v = Number(txt);
      if (!Number.isFinite(v)) {
        throw new ErrorExpresion(`Número mal escrito: '${txt}'`);
      }
      lista.push({ tipo: TIPO.NUMERO, texto: txt, valor: v });
      continue;
    }

    if (esLetra(c)) {
      const ini = p;
      while (p < s.length && (esLetra(s[p]) || esDigito(s[p]))) p++;
      lista.push({ tipo: TIPO.IDENT, texto: s.slice(ini, p), valor: 0 });
      continue;
    }

    if (c === '(' || c === '[') {
      lista.push({ tipo: TIPO.ABRE, texto: c, valor: 0 });
      p++;
    } else if (c === ')' || c === ']') {
      lista.push({ tipo: TIPO.CIERRA, texto: c, valor: 0 });
      p++;
    } else if (c === ',') {
      lista.push({ tipo: TIPO.COMA, texto: ',', valor: 0 });
      p++;
    } else if (c === '*') {
      if (p + 1 < s.length && s[p + 1] === '*') {
        lista.push({ tipo: TIPO.OPERADOR, texto: '^', valor: 0 });
        p += 2;
      } else {
        lista.push({ tipo: TIPO.OPERADOR, texto: '*', valor: 0 });
        p++;
      }
    } else if (c === '+' || c === '-' || c === '/' || c === '^') {
      lista.push({ tipo: TIPO.OPERADOR, texto: c, valor: 0 });
      p++;
    } else {
      throw new ErrorExpresion(`Carácter no válido: '${c}'`);
    }
  }
  lista.push({ tipo: TIPO.FIN, texto: '', valor: 0 });
  return lista;
}

function aplicar(clave, nombre, args) {
  // log con dos argumentos es el logaritmo en la base indicada: log(8, 2) = 3.
  if (clave === 'log' && args.length === 2) {
    const [v, b] = args;
    return (x) => Math.log(v(x)) / Math.log(b(x));
  }
  if (args.length !== 1) {
    throw new ErrorExpresion(
      `La función '${nombre}' espera 1 argumento y recibió ${args.length}`,
    );
  }
  const a = args[0];
  switch (clave) {
    case 'sin':
    case 'sen':
      return (x) => Math.sin(a(x));
    case 'cos':
      return (x) => Math.cos(a(x));
    case 'tan':
    case 'tg':
      return (x) => Math.tan(a(x));
    case 'sec':
      return (x) => 1 / Math.cos(a(x));
    case 'csc':
      return (x) => 1 / Math.sin(a(x));
    case 'cot':
      return (x) => Math.cos(a(x)) / Math.sin(a(x));
    case 'asin':
      return (x) => Math.asin(a(x));
    case 'acos':
      return (x) => Math.acos(a(x));
    case 'atan':
      return (x) => Math.atan(a(x));
    case 'sinh':
      return (x) => Math.sinh(a(x));
    case 'cosh':
      return (x) => Math.cosh(a(x));
    case 'tanh':
      return (x) => Math.tanh(a(x));
    case 'exp':
      return (x) => Math.exp(a(x));
    case 'ln':
    case 'log':
      return (x) => Math.log(a(x));
    case 'log10':
      return (x) => Math.log10(a(x));
    case 'log2':
      return (x) => Math.log(a(x)) / Math.log(2);
    case 'sqrt':
      return (x) => Math.sqrt(a(x));
    case 'cbrt':
      return (x) => Math.cbrt(a(x));
    case 'abs':
      return (x) => Math.abs(a(x));
    default:
      throw new ErrorExpresion(`Función desconocida: '${nombre}'`);
  }
}

/**
 * Compila el texto y devuelve una función `(x) => number`.
 *
 * @throws {ErrorExpresion} si el texto no es una expresión válida
 */
export function compilar(texto) {
  if (texto == null || String(texto).trim() === '') {
    throw new ErrorExpresion('Escribe una expresión, por ejemplo: x^2 - 2');
  }
  const tokens = separarTokens(normalizar(String(texto)));
  let i = 0;

  const actual = () => tokens[i];
  const esOperador = (op) => actual().tipo === TIPO.OPERADOR && actual().texto === op;
  /** Indica si aquí puede empezar un primario, señal de multiplicación implícita. */
  const empiezaPrimario = () => {
    const t = actual().tipo;
    return t === TIPO.NUMERO || t === TIPO.IDENT || t === TIPO.ABRE;
  };

  function expresion() {
    let izq = termino();
    while (esOperador('+') || esOperador('-')) {
      const suma = esOperador('+');
      i++;
      const a = izq;
      const b = termino();
      izq = suma ? (x) => a(x) + b(x) : (x) => a(x) - b(x);
    }
    return izq;
  }

  function termino() {
    let izq = unario();
    for (;;) {
      if (esOperador('*') || esOperador('/')) {
        const mult = esOperador('*');
        i++;
        const a = izq;
        const b = unario();
        izq = mult ? (x) => a(x) * b(x) : (x) => a(x) / b(x);
      } else if (empiezaPrimario()) {
        // Multiplicación implícita: 2x, 3(x+1), x sen(x). Se llama a potencia() y
        // no a unario() porque un '-' aquí pertenece a la suma, no a este factor.
        const a = izq;
        const b = potencia();
        izq = (x) => a(x) * b(x);
      } else {
        return izq;
      }
    }
  }

  function unario() {
    if (esOperador('-')) {
      i++;
      const a = unario();
      return (x) => -a(x);
    }
    if (esOperador('+')) {
      i++;
      return unario();
    }
    return potencia();
  }

  function potencia() {
    const base = primario();
    if (esOperador('^')) {
      i++;
      const a = base;
      // El exponente vuelve a pasar por unario(): así '^' queda asociativa a la
      // derecha (2^3^2 = 2^9) y además admite 2^-2.
      const b = unario();
      return (x) => Math.pow(a(x), b(x));
    }
    return base;
  }

  function primario() {
    const t = actual();

    if (t.tipo === TIPO.NUMERO) {
      i++;
      const v = t.valor;
      return () => v;
    }

    if (t.tipo === TIPO.ABRE) {
      i++;
      const dentro = expresion();
      if (actual().tipo !== TIPO.CIERRA) {
        throw new ErrorExpresion('Falta cerrar un paréntesis');
      }
      i++;
      return dentro;
    }

    if (t.tipo === TIPO.IDENT) {
      const nombre = t.texto;
      const clave = nombre.toLowerCase();

      if (FUNCIONES.has(clave)) {
        i++;
        if (actual().tipo !== TIPO.ABRE) {
          throw new ErrorExpresion(
            `La función '${nombre}' necesita paréntesis, por ejemplo ${clave}(x)`,
          );
        }
        i++;
        const args = [];
        if (actual().tipo !== TIPO.CIERRA) {
          args.push(expresion());
          while (actual().tipo === TIPO.COMA) {
            i++;
            args.push(expresion());
          }
        }
        if (actual().tipo !== TIPO.CIERRA) {
          throw new ErrorExpresion('Falta cerrar un paréntesis');
        }
        i++;
        return aplicar(clave, nombre, args);
      }

      if (clave === 'x') {
        i++;
        return (x) => x;
      }
      if (clave === 'pi') {
        i++;
        return () => Math.PI;
      }
      if (clave === 'e') {
        i++;
        return () => Math.E;
      }
      throw new ErrorExpresion(
        `Variable o constante desconocida: '${nombre}'. Usa x como variable`,
      );
    }

    if (t.tipo === TIPO.OPERADOR) {
      throw new ErrorExpresion(`Falta un valor junto al operador '${t.texto}'`);
    }
    if (t.tipo === TIPO.CIERRA) {
      throw new ErrorExpresion('Hay un paréntesis de cierre de más');
    }
    throw new ErrorExpresion('La expresión está incompleta');
  }

  const raiz = expresion();
  const sobra = actual();
  if (sobra.tipo === TIPO.CIERRA) {
    throw new ErrorExpresion('Hay un paréntesis de cierre de más');
  }
  if (sobra.tipo !== TIPO.FIN) {
    throw new ErrorExpresion(`Sobra algo al final de la expresión: '${sobra.texto}'`);
  }
  return raiz;
}

/** Atajo para evaluar una expresión una sola vez. */
export function evaluar(texto, x) {
  return compilar(texto)(x);
}

/**
 * Versión que no lanza, pensada para la validación en vivo del formulario.
 *
 * @returns {{fn: ((x: number) => number)|null, error: string|null}}
 */
export function intentarCompilar(texto) {
  try {
    return { fn: compilar(texto), error: null };
  } catch (e) {
    return { fn: null, error: e.message };
  }
}
