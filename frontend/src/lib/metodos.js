/**
 * Motor numérico del navegador. Port exacto del paquete Java
 * backend/src/main/java/com/analisis/raices/metodos/.
 *
 * Existe para que la aplicación funcione aunque el servidor Java no esté
 * configurado o esté dormido: devuelve el MISMO JSON que la API, con el mismo
 * número de iteraciones y los mismos mensajes, cambiando solo `motor`.
 *
 * Si se toca un método aquí, hay que tocarlo igual en Java (y al revés).
 */

import { compilar } from './expresion.js';

/** Más allá de esta magnitud se considera que el método se escapó. */
const LIMITE_DIVERGENCIA = 1e15;

/** Tolerancia por omisión. */
export const TOLERANCIA_POR_OMISION = 1e-6;

/** Máximo de iteraciones por omisión. */
export const MAX_ITERACIONES_POR_OMISION = 100;

/** Tope absoluto de iteraciones que se acepta. */
export const TOPE_ITERACIONES = 1000;

/** Formas de medir el error, con la etiqueta que se muestra en la interfaz. */
export const TIPOS_ERROR = [
  { id: 'ABSOLUTO', etiqueta: 'Error absoluto |xi − xi−1|' },
  { id: 'RELATIVO', etiqueta: 'Error relativo |xi − xi−1| / |xi|' },
  { id: 'RESIDUAL', etiqueta: 'Residual |f(xi)|' },
];

/** Devuelve el valor, o null si no es un número finito (NaN no es JSON válido). */
function json(v) {
  return Number.isFinite(v) ? v : null;
}

/**
 * Formato científico con tres decimales.
 *
 * Java rellena el exponente con ceros y aquí se quitan igual que allí, para que
 * los mensajes de los dos motores salgan idénticos carácter por carácter.
 */
function formatear(v) {
  return v.toExponential(3);
}

/**
 * Pizarra de trabajo que comparten todos los métodos: funciones compiladas,
 * criterio de parada y lista de iteraciones.
 *
 * Los métodos solo calculan la siguiente estimación y llaman a `agregar`; toda
 * la lógica de cuándo parar vive aquí.
 */
export function crearContexto({ f, g, df, tolerancia, maxIteraciones, tipoError }) {
  const iteraciones = [];
  const estado = {
    convergio: false,
    mensaje: '',
    raiz: NaN,
    fRaiz: NaN,
    errorFinal: null,
  };

  function terminar(exito, texto) {
    estado.convergio = exito;
    estado.mensaje = texto;
    return true;
  }

  return {
    tolerancia,
    maxIteraciones,
    tipoError,
    iteraciones,
    estado,

    /** Evalúa f(x). */
    f(x) {
      return f(x);
    },

    /** Evalúa g(x), la función de iteración del punto fijo. */
    g(x) {
      if (!g) {
        throw new Error('Este método necesita la función g(x)');
      }
      return g(x);
    },

    /**
     * Evalúa f′(x). Si no se recibió la derivada, se aproxima con diferencia
     * central y un paso proporcional a la magnitud de x.
     */
    df(x) {
      if (df) return df(x);
      const h = 1e-6 * Math.max(1, Math.abs(x));
      return (f(x + h) - f(x - h)) / (2 * h);
    },

    /**
     * Error de la nueva estimación según el tipo elegido. El residual se puede
     * calcular siempre; el absoluto y el relativo necesitan estimación anterior.
     */
    error(anterior, nuevo, fNuevo) {
      if (tipoError === 'RESIDUAL') {
        return Math.abs(fNuevo);
      }
      if (anterior === null || anterior === undefined) {
        return null;
      }
      const diferencia = Math.abs(nuevo - anterior);
      if (tipoError === 'ABSOLUTO') {
        return diferencia;
      }
      // Si la nueva estimación es exactamente 0 no se puede dividir: se usa la
      // diferencia absoluta para no devolver infinito.
      return nuevo === 0 ? diferencia : diferencia / Math.abs(nuevo);
    },

    /** Registra una iteración y devuelve true si hay que detenerse. */
    agregar(x, fx, error, valores) {
      const n = iteraciones.length + 1;

      const limpios = {};
      for (const clave of Object.keys(valores)) {
        limpios[clave] = json(valores[clave]);
      }

      iteraciones.push({
        n,
        x: json(x),
        fx: json(fx),
        error: json(error),
        valores: limpios,
      });

      estado.raiz = x;
      estado.fRaiz = fx;
      estado.errorFinal = error;

      if (!Number.isFinite(x) || !Number.isFinite(fx)) {
        return terminar(
          false,
          `El método diverge: en la iteración ${n} apareció un valor que no es un número.`
            + ' Prueba con otro valor inicial.',
        );
      }
      if (fx === 0) {
        return terminar(true, `Raíz exacta: f(x) = 0 en la iteración ${n}.`);
      }
      if (error !== null && error !== undefined && error <= tolerancia) {
        return terminar(
          true,
          `Convergió en ${n}${n === 1 ? ' iteración' : ' iteraciones'}: el error `
            + `${formatear(error)} es menor o igual que la tolerancia `
            + `${formatear(tolerancia)}.`,
        );
      }
      if (Math.abs(x) > LIMITE_DIVERGENCIA) {
        return terminar(
          false,
          `El método diverge: en la iteración ${n} la estimación superó 1e15.`
            + ' Prueba con otro valor inicial.',
        );
      }
      return false;
    },

    /** Marca un final sin éxito con un motivo propio del método. */
    fallar(texto) {
      terminar(false, texto);
    },

    /** Mensaje para cuando el bucle acaba sin haber alcanzado la tolerancia. */
    agotado() {
      if (estado.mensaje !== '') return;
      terminar(
        false,
        `Se alcanzó el máximo de ${maxIteraciones}`
          + `${maxIteraciones === 1 ? ' iteración' : ' iteraciones'} sin bajar de la `
          + `tolerancia ${formatear(tolerancia)}. Sube el máximo o afloja la tolerancia.`,
      );
    },
  };
}

/** Lee un valor inicial que ya debería estar validado. */
function exigir(valor, nombre) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    throw new Error(`Falta el valor inicial ${nombre}`);
  }
  return Number(valor);
}

// ------------------------------------------------------------------ métodos

const COLUMNAS_CERRADOS = [
  { clave: 'a', etiqueta: 'a' },
  { clave: 'b', etiqueta: 'b' },
  { clave: 'xr', etiqueta: 'xr' },
  { clave: 'fa', etiqueta: 'f(a)' },
  { clave: 'fb', etiqueta: 'f(b)' },
  { clave: 'fxr', etiqueta: 'f(xr)' },
];

/**
 * Cuerpo común de bisección y falsa posición: solo cambia cómo se estima xr
 * dentro del intervalo.
 */
function ejecutarCerrado(ctx, solicitud, estimar) {
  let a = exigir(solicitud.a, 'a');
  let b = exigir(solicitud.b, 'b');
  if (a > b) {
    const t = a;
    a = b;
    b = t;
  }
  if (a === b) {
    throw new Error('El intervalo está vacío: a y b son iguales');
  }

  let fa = ctx.f(a);
  let fb = ctx.f(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
    throw new Error('No se puede evaluar f en los extremos del intervalo. Revisa a y b');
  }
  if (fa * fb > 0) {
    throw new Error(
      'f(a) y f(b) tienen el mismo signo, así que no se garantiza una raíz en [a, b].'
        + ' Elige un intervalo donde f cambie de signo',
    );
  }

  const fila = (ai, bi, xr, fai, fbi, fxr) => ({
    a: ai, b: bi, xr, fa: fai, fb: fbi, fxr,
  });

  // Si alguno de los extremos ya es la raíz, se registra y se termina.
  if (fa === 0) {
    ctx.agregar(a, fa, ctx.error(null, a, fa), fila(a, b, a, fa, fb, fa));
    return;
  }
  if (fb === 0) {
    ctx.agregar(b, fb, ctx.error(null, b, fb), fila(a, b, b, fa, fb, fb));
    return;
  }

  let anterior = null;
  for (let k = 0; k < ctx.maxIteraciones; k++) {
    const xr = estimar(a, b, fa, fb);
    const fxr = ctx.f(xr);
    const error = ctx.error(anterior, xr, fxr);

    // Se guardan a y b tal como estaban al calcular xr, antes de recortar.
    if (ctx.agregar(xr, fxr, error, fila(a, b, xr, fa, fb, fxr))) {
      return;
    }

    if (fa * fxr < 0) {
      b = xr;
      fb = fxr;
    } else {
      a = xr;
      fa = fxr;
    }
    anterior = xr;
  }
}

const biseccion = {
  id: 'biseccion',
  nombre: 'Bisección',
  descripcion:
    'Parte el intervalo [a, b] por la mitad y conserva el trozo donde f cambia de signo.'
    + ' Siempre converge si f(a) y f(b) tienen signos distintos, aunque despacio.',
  requiere: ['a', 'b'],
  columnas: COLUMNAS_CERRADOS,
  ejecutar(ctx, solicitud) {
    ejecutarCerrado(ctx, solicitud, (a, b) => (a + b) / 2);
  },
};

const falsaPosicion = {
  id: 'falsa_posicion',
  nombre: 'Falsa posición',
  descripcion:
    'Traza la cuerda entre (a, f(a)) y (b, f(b)) y toma su corte con el eje x.'
    + ' Aprovecha la pendiente de f, así que suele llegar antes que bisección.',
  requiere: ['a', 'b'],
  columnas: COLUMNAS_CERRADOS,
  ejecutar(ctx, solicitud) {
    ejecutarCerrado(ctx, solicitud, (a, b, fa, fb) => b - (fb * (a - b)) / (fa - fb));
  },
};

const puntoFijo = {
  id: 'punto_fijo',
  nombre: 'Punto fijo',
  descripcion:
    'Reescribe la ecuación como x = g(x) y repite x_{i+1} = g(x_i).'
    + ' Converge si |g′(x)| < 1 alrededor de la raíz.',
  requiere: ['x0', 'g'],
  columnas: [
    { clave: 'xi', etiqueta: 'xi' },
    { clave: 'gxi', etiqueta: 'g(xi)' },
    { clave: 'fxi1', etiqueta: 'f(xi+1)' },
  ],
  ejecutar(ctx, solicitud) {
    let x = exigir(solicitud.x0, 'x0');

    for (let k = 0; k < ctx.maxIteraciones; k++) {
      const xi = x;
      const gxi = ctx.g(xi);
      const fxi1 = ctx.f(gxi);
      const error = ctx.error(xi, gxi, fxi1);

      if (ctx.agregar(gxi, fxi1, error, { xi, gxi, fxi1 })) {
        return;
      }
      x = gxi;
    }
  },
};

const newton = {
  id: 'newton',
  nombre: 'Newton-Raphson',
  descripcion:
    'Sigue la tangente de f en x_i hasta cortar el eje x:'
    + ' x_{i+1} = x_i − f(x_i)/f′(x_i). Muy rápido, pero necesita que f′ no se anule.',
  requiere: ['x0'],
  columnas: [
    { clave: 'xi', etiqueta: 'xi' },
    { clave: 'fxi', etiqueta: 'f(xi)' },
    { clave: 'dfxi', etiqueta: 'f′(xi)' },
    { clave: 'xi1', etiqueta: 'xi+1' },
  ],
  ejecutar(ctx, solicitud) {
    let x = exigir(solicitud.x0, 'x0');

    for (let k = 0; k < ctx.maxIteraciones; k++) {
      const xi = x;
      const fxi = ctx.f(xi);
      const dfxi = ctx.df(xi);

      if (dfxi === 0 || !Number.isFinite(dfxi)) {
        ctx.fallar(
          `La derivada se anuló en la iteración ${k + 1}, así que la tangente no corta`
            + ' el eje. Prueba con otro x0.',
        );
        return;
      }

      const xi1 = xi - fxi / dfxi;
      const fxi1 = ctx.f(xi1);
      const error = ctx.error(xi, xi1, fxi1);

      if (ctx.agregar(xi1, fxi1, error, { xi, fxi, dfxi, xi1 })) {
        return;
      }
      x = xi1;
    }
  },
};

const secante = {
  id: 'secante',
  nombre: 'Secante',
  descripcion:
    'Reemplaza la tangente de Newton por la recta que une los dos últimos puntos,'
    + ' así que no necesita la derivada. Casi tan rápido como Newton.',
  requiere: ['x0', 'x1'],
  columnas: [
    { clave: 'xim1', etiqueta: 'xi−1' },
    { clave: 'xi', etiqueta: 'xi' },
    { clave: 'fxim1', etiqueta: 'f(xi−1)' },
    { clave: 'fxi', etiqueta: 'f(xi)' },
    { clave: 'xi1', etiqueta: 'xi+1' },
  ],
  ejecutar(ctx, solicitud) {
    let xim1 = exigir(solicitud.x0, 'x0');
    let xi = exigir(solicitud.x1, 'x1');
    let fxim1 = ctx.f(xim1);
    let fxi = ctx.f(xi);

    for (let k = 0; k < ctx.maxIteraciones; k++) {
      const denominador = fxi - fxim1;
      if (denominador === 0 || !Number.isFinite(denominador)) {
        ctx.fallar(
          `En la iteración ${k + 1} los dos puntos dan el mismo valor de f: la secante`
            + ' queda horizontal. Prueba con otros x0 y x1.',
        );
        return;
      }

      const xi1 = xi - (fxi * (xi - xim1)) / denominador;
      const fxi1 = ctx.f(xi1);
      const error = ctx.error(xi, xi1, fxi1);

      if (ctx.agregar(xi1, fxi1, error, { xim1, xi, fxim1, fxi, xi1 })) {
        return;
      }

      xim1 = xi;
      fxim1 = fxi;
      xi = xi1;
      fxi = fxi1;
    }
  },
};

const steffensen = {
  id: 'steffensen',
  nombre: 'Steffensen',
  descripcion:
    'Con z = x + f(x), avanza a x − f(x)²/(f(z) − f(x)).'
    + ' Llega a la velocidad de Newton sin necesitar la derivada.',
  requiere: ['x0'],
  columnas: [
    { clave: 'xi', etiqueta: 'xi' },
    { clave: 'fxi', etiqueta: 'f(xi)' },
    { clave: 'z', etiqueta: 'z = xi + f(xi)' },
    { clave: 'fxifx', etiqueta: 'f(z)' },
    { clave: 'xi1', etiqueta: 'xi+1' },
  ],
  ejecutar(ctx, solicitud) {
    let x = exigir(solicitud.x0, 'x0');

    for (let k = 0; k < ctx.maxIteraciones; k++) {
      const xi = x;
      const fxi = ctx.f(xi);
      const z = xi + fxi;
      const fz = ctx.f(z);
      const denominador = fz - fxi;

      if (denominador === 0 || !Number.isFinite(denominador)) {
        ctx.fallar(
          `En la iteración ${k + 1} se anuló el denominador f(z) − f(x). Prueba con otro x0.`,
        );
        return;
      }

      const xi1 = xi - (fxi * fxi) / denominador;
      const fxi1 = ctx.f(xi1);
      const error = ctx.error(xi, xi1, fxi1);

      if (ctx.agregar(xi1, fxi1, error, { xi, fxi, z, fxifx: fz, xi1 })) {
        return;
      }
      x = xi1;
    }
  },
};

const muller = {
  id: 'muller',
  nombre: 'Müller',
  descripcion:
    'Pasa una parábola por los tres últimos puntos y usa su corte con el eje x.'
    + ' Al curvarse se acerca más rápido que la secante.',
  requiere: ['x0', 'x1', 'x2'],
  columnas: [
    { clave: 'x0', etiqueta: 'x0' },
    { clave: 'x1', etiqueta: 'x1' },
    { clave: 'x2', etiqueta: 'x2' },
    { clave: 'x3', etiqueta: 'x3' },
  ],
  ejecutar(ctx, solicitud) {
    let x0 = exigir(solicitud.x0, 'x0');
    let x1 = exigir(solicitud.x1, 'x1');
    let x2 = exigir(solicitud.x2, 'x2');

    for (let k = 0; k < ctx.maxIteraciones; k++) {
      const f0 = ctx.f(x0);
      const f1 = ctx.f(x1);
      const f2 = ctx.f(x2);

      const h0 = x1 - x0;
      const h1 = x2 - x1;
      if (h0 === 0 || h1 === 0) {
        ctx.fallar('Los tres puntos iniciales deben ser distintos para poder trazar la parábola.');
        return;
      }

      const d0 = (f1 - f0) / h0;
      const d1 = (f2 - f1) / h1;
      const pa = (d1 - d0) / (h1 + h0);
      const pb = pa * h1 + d1;
      const pc = f2;

      const discriminante = pb * pb - 4 * pa * pc;
      if (discriminante < 0) {
        ctx.fallar(
          `En la iteración ${k + 1} la parábola no corta el eje x: la raíz es compleja.`
            + ' Prueba con otros puntos iniciales.',
        );
        return;
      }

      const r = Math.sqrt(discriminante);
      // Se elige el denominador de mayor magnitud para no perder cifras.
      const denominador = Math.abs(pb + r) > Math.abs(pb - r) ? pb + r : pb - r;
      if (denominador === 0) {
        ctx.fallar(
          `En la iteración ${k + 1} la parábola queda plana. Prueba con otros puntos.`,
        );
        return;
      }

      const x3 = x2 - (2 * pc) / denominador;
      const f3 = ctx.f(x3);
      const error = ctx.error(x2, x3, f3);

      if (ctx.agregar(x3, f3, error, { x0, x1, x2, x3, pa, pb, pc })) {
        return;
      }

      x0 = x1;
      x1 = x2;
      x2 = x3;
    }
  },
};

/**
 * Registro ordenado de los métodos, igual que CatalogoMetodos en Java.
 *
 * Para añadir uno nuevo: se define su objeto arriba y se suma a esta lista.
 */
export const METODOS = [
  biseccion,
  falsaPosicion,
  puntoFijo,
  newton,
  secante,
  steffensen,
  muller,
];

/** Busca un método por su id. */
export function buscarMetodo(id) {
  const m = METODOS.find((x) => x.id === String(id ?? '').trim());
  if (!m) {
    throw new Error(
      `Método desconocido: '${id}'. Disponibles: ${METODOS.map((x) => x.id).join(', ')}`,
    );
  }
  return m;
}

/** True si el método trabaja sobre un intervalo cerrado [a, b]. */
export function esCerrado(metodo) {
  return metodo.requiere.includes('a') && metodo.requiere.includes('b');
}

function tiene(texto) {
  return texto !== null && texto !== undefined && String(texto).trim() !== '';
}

/** Verifica que lleguen los valores iniciales que el método declara en `requiere`. */
function comprobarDatosIniciales(metodo, s) {
  for (const dato of metodo.requiere) {
    let falta;
    switch (dato) {
      case 'a': falta = s.a === null || s.a === undefined; break;
      case 'b': falta = s.b === null || s.b === undefined; break;
      case 'x0': falta = s.x0 === null || s.x0 === undefined; break;
      case 'x1': falta = s.x1 === null || s.x1 === undefined; break;
      case 'x2': falta = s.x2 === null || s.x2 === undefined; break;
      case 'g': falta = !tiene(s.g); break;
      default: falta = false;
    }
    if (falta) {
      throw new Error(
        `El método ${metodo.nombre} necesita `
          + (dato === 'g' ? 'la función g(x)' : `el valor inicial ${dato}`),
      );
    }
  }
}

/**
 * Resuelve f(x) = 0 en el navegador.
 *
 * @param {object} solicitud mismo cuerpo que acepta POST /api/raices/resolver
 * @returns {object} mismo JSON que devuelve la API, con motor 'navegador'
 */
export function resolverLocal(solicitud) {
  const inicio = (typeof performance !== 'undefined' ? performance : Date).now();

  const metodo = buscarMetodo(solicitud.metodo);

  const tolerancia = solicitud.tolerancia == null
    ? TOLERANCIA_POR_OMISION
    : Number(solicitud.tolerancia);
  if (!(tolerancia > 0) || !Number.isFinite(tolerancia)) {
    throw new Error('La tolerancia tiene que ser un número mayor que cero');
  }

  const maxIteraciones = solicitud.maxIteraciones == null
    ? MAX_ITERACIONES_POR_OMISION
    : Number(solicitud.maxIteraciones);
  if (maxIteraciones < 1 || maxIteraciones > TOPE_ITERACIONES) {
    throw new Error(`El máximo de iteraciones tiene que estar entre 1 y ${TOPE_ITERACIONES}`);
  }

  const tipoError = solicitud.tipoError == null ? 'ABSOLUTO' : solicitud.tipoError;

  comprobarDatosIniciales(metodo, solicitud);

  const f = compilar(solicitud.funcion);
  const g = tiene(solicitud.g) ? compilar(solicitud.g) : null;
  const df = tiene(solicitud.derivada) ? compilar(solicitud.derivada) : null;

  const ctx = crearContexto({ f, g, df, tolerancia, maxIteraciones, tipoError });
  metodo.ejecutar(ctx, solicitud);
  ctx.agotado();

  const tiempoMs = Math.round(
    (typeof performance !== 'undefined' ? performance : Date).now() - inicio,
  );

  return {
    metodo: metodo.id,
    nombreMetodo: metodo.nombre,
    convergio: ctx.estado.convergio,
    raiz: json(ctx.estado.raiz),
    fRaiz: json(ctx.estado.fRaiz),
    errorFinal: json(ctx.estado.errorFinal),
    iteracionesRealizadas: ctx.iteraciones.length,
    mensaje: ctx.estado.mensaje,
    columnas: metodo.columnas,
    iteraciones: ctx.iteraciones,
    tiempoMs,
    motor: 'navegador',
  };
}
