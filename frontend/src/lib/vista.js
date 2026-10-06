/**
 * Cálculo de la ventana que se muestra en la gráfica y búsqueda de cambios de
 * signo.
 *
 * La idea es que el encuadre nunca quede dominado por una asíntota: el rango
 * vertical se decide con percentiles del muestreo, no con el máximo y el mínimo.
 */

/** Paso "bonito" (1, 2 o 5 por una potencia de diez) más cercano al pedido. */
export function pasoBonito(aproximado) {
  if (!Number.isFinite(aproximado) || aproximado <= 0) return 1;
  const potencia = Math.pow(10, Math.floor(Math.log10(aproximado)));
  const normalizado = aproximado / potencia;
  let base;
  if (normalizado <= 1) base = 1;
  else if (normalizado <= 2) base = 2;
  else if (normalizado <= 5) base = 5;
  else base = 10;
  return base * potencia;
}

/**
 * Estira un intervalo hasta valores limpios, para que las etiquetas de los ejes
 * no salgan con decimales raros.
 */
export function redondearIntervalo(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return [-5, 5];
  }
  const paso = pasoBonito((max - min) / 8);
  const desde = Math.floor(min / paso) * paso;
  const hasta = Math.ceil(max / paso) * paso;
  // Multiplicar y dividir arrastra basura de coma flotante (0.30000000000000004).
  // Se limpia con precisión relativa, no absoluta, para que un encuadre muy
  // acercado no se redondee a cero.
  const limpiar = (v) => Number(v.toPrecision(15));
  return [limpiar(desde), limpiar(hasta)];
}

/** Percentil de una lista ya ordenada. */
function percentil(ordenados, p) {
  if (ordenados.length === 0) return 0;
  const i = (ordenados.length - 1) * p;
  const bajo = Math.floor(i);
  const alto = Math.ceil(i);
  if (bajo === alto) return ordenados[bajo];
  return ordenados[bajo] + (ordenados[alto] - ordenados[bajo]) * (i - bajo);
}

/**
 * Calcula la ventana {x0, x1, y0, y1} que encuadra unos puntos de interés.
 *
 * @param {Function|Function[]} f función (o funciones) con las que se mide el
 *   rango vertical. En punto fijo se pasan g(x) y la recta y = x, porque es lo
 *   que se dibuja, no f.
 * @param {number[]} xs valores de x que tienen que quedar dentro
 * @param {number[]} extraY valores de y que también tienen que quedar dentro
 * @param {number} anchoMinimo ancho mínimo en x; con 0 se ajusta sin holgura
 */
export function vistaPara(f, xs, extraY = [], anchoMinimo = 1.5) {
  const funciones = Array.isArray(f) ? f : [f];
  const finitos = (xs ?? []).filter((v) => Number.isFinite(v));

  let min;
  let max;
  if (finitos.length === 0) {
    min = -5;
    max = 5;
  } else {
    min = Math.min(...finitos);
    max = Math.max(...finitos);
  }

  let ancho = max - min;
  // Con anchoMinimo 0 y un solo punto el ancho sería 0, lo que dejaría la vista
  // degenerada: se abre una ventana diminuta pero válida alrededor del punto.
  if (ancho <= 0 || ancho < anchoMinimo) {
    const centro = (min + max) / 2;
    const mitad = Math.max(anchoMinimo, Math.abs(centro) * 1e-6, 1e-9) / 2;
    min = centro - mitad;
    max = centro + mitad;
    ancho = max - min;
  }

  // 35 % de margen a cada lado para que los puntos no toquen el borde.
  const margen = ancho * 0.35;
  const [x0, x1] = redondearIntervalo(min - margen, max + margen);

  // Muestreo para decidir el rango vertical.
  const muestras = 480;
  const valores = [];
  for (let i = 0; i <= muestras; i++) {
    const x = x0 + ((x1 - x0) * i) / muestras;
    for (const fn of funciones) {
      let y;
      try {
        y = fn(x);
      } catch {
        y = NaN;
      }
      if (Number.isFinite(y)) valores.push(y);
    }
  }
  for (const y of extraY ?? []) {
    if (Number.isFinite(y)) valores.push(y);
  }

  valores.sort((a, b) => a - b);
  // Percentiles 3 y 97: así una asíntota que se va a ±10⁹ no aplasta la curva.
  let y0 = percentil(valores, 0.03);
  let y1 = percentil(valores, 0.97);

  // El eje y = 0 es donde está la raíz: siempre tiene que verse.
  y0 = Math.min(y0, 0);
  y1 = Math.max(y1, 0);

  if (!(y1 > y0)) {
    y0 -= 1;
    y1 += 1;
  }
  const margenY = (y1 - y0) * 0.12;
  return { x0, x1, y0: y0 - margenY, y1: y1 + margenY };
}

/**
 * Busca intervalos donde f cambia de signo entre x0 y x1.
 *
 * Los saltos de una asíntota también cambian de signo, así que cada candidato
 * se afina por bisección: si al estrecharlo f se va a valores enormes en vez de
 * acercarse a cero, era un polo y se descarta.
 *
 * @returns {{a: number, b: number, x: number}[]} intervalo y raíz aproximada
 */
export function buscarCambiosDeSigno(f, x0, x1, muestras = 600) {
  const encontrados = [];
  if (!(x1 > x0)) return encontrados;

  const paso = (x1 - x0) / muestras;
  let xa = x0;
  let fa = evaluar(f, xa);

  for (let i = 1; i <= muestras; i++) {
    const xb = x0 + paso * i;
    const fb = evaluar(f, xb);

    if (Number.isFinite(fa) && Number.isFinite(fb)) {
      if (fa === 0) {
        encontrados.push({ a: xa - paso, b: xa + paso, x: xa });
      } else if (fa * fb < 0) {
        const afinada = afinar(f, xa, fa, xb, fb);
        if (afinada !== null) {
          encontrados.push({ a: xa, b: xb, x: afinada });
        }
      }
    }

    xa = xb;
    fa = fb;
  }
  return encontrados;
}

function evaluar(f, x) {
  try {
    return f(x);
  } catch {
    return NaN;
  }
}

/**
 * Bisecciona el intervalo para ver si de verdad hay una raíz.
 *
 * @returns la raíz aproximada, o null si el cambio de signo era una asíntota
 */
function afinar(f, a0, fa0, b0, fb0) {
  let a = a0;
  let b = b0;
  let fa = fa0;
  let medio = (a + b) / 2;

  for (let k = 0; k < 60; k++) {
    medio = (a + b) / 2;
    const fm = evaluar(f, medio);
    if (!Number.isFinite(fm)) return null;
    if (fm === 0) return medio;
    if (fa * fm < 0) {
      b = medio;
    } else {
      a = medio;
      fa = fm;
    }
  }

  const fm = evaluar(f, medio);
  if (!Number.isFinite(fm)) return null;
  // En una raíz de verdad |f| se desploma; en un polo se dispara.
  const escala = Math.max(1, Math.abs(fa0), Math.abs(fb0));
  return Math.abs(fm) < 1e-6 * escala ? medio : null;
}
