/**
 * Todo el dibujo del lienzo: papel milimetrado, ejes, la curva, la animación de
 * cada paso del método, el rastro de estimaciones y la lectura bajo el cursor.
 *
 * Aquí no hay nada de React. El componente solo llama a `dibujarEscena` con el
 * estado que toca pintar, lo que deja el dibujo fácil de razonar y de ajustar.
 *
 * Para añadir un método nuevo basta con sumar un `case` en `dibujarPaso`.
 */

import { pasoBonito } from './vista.js';
import { ejeLabel, subindice } from './formato.js';

const FUENTE = '11px "B612 Mono", ui-monospace, monospace';
const FUENTE_ETIQUETA = 'bold 12px "B612 Mono", ui-monospace, monospace';

/** Lee los colores del tema desde las variables CSS: una sola fuente de verdad. */
export function leerTema(elemento) {
  const estilo = getComputedStyle(elemento ?? document.documentElement);
  const v = (nombre, porDefecto) => {
    const valor = estilo.getPropertyValue(nombre).trim();
    return valor === '' ? porDefecto : valor;
  };
  return {
    papel: v('--papel', '#f5f9f7'),
    rejillaFina: v('--rejilla-fina', '#e1eee9'),
    rejillaGruesa: v('--rejilla-gruesa', '#bed9d0'),
    tinta: v('--tinta', '#1a2a3a'),
    tintaSuave: v('--tinta-suave', '#5b6e7c'),
    curva: v('--curva', '#1e5ba8'),
    marca: v('--marca', '#c4302b'),
    curvaG: v('--curva-g', '#23805a'),
  };
}

/**
 * Cuáles de los valores de cada iteración son coordenadas x.
 *
 * Hace falta para "acercar en cada paso": en bisección, `fa` y `fb` también son
 * números del mapa de valores, pero son alturas, no posiciones del eje x.
 */
export const CLAVES_X = {
  biseccion: ['a', 'b', 'xr'],
  falsa_posicion: ['a', 'b', 'xr'],
  punto_fijo: ['xi', 'gxi'],
  newton: ['xi', 'xi1'],
  secante: ['xim1', 'xi', 'xi1'],
  steffensen: ['xi', 'z', 'xi1'],
  muller: ['x0', 'x1', 'x2', 'x3'],
};

/** Valores de x del paso dado, para encuadrar solo ese paso. */
export function xsDelPaso(metodoId, iteracion) {
  const claves = CLAVES_X[metodoId] ?? [];
  const valores = iteracion?.valores ?? {};
  const xs = claves.map((clave) => valores[clave]).filter((v) => Number.isFinite(v));
  if (Number.isFinite(iteracion?.x)) xs.push(iteracion.x);
  return xs;
}

/** Conversión entre coordenadas del plano y píxeles del lienzo. */
export function crearTransformacion(vista, ancho, alto) {
  const anchoX = vista.x1 - vista.x0;
  const altoY = vista.y1 - vista.y0;
  return {
    ancho,
    alto,
    vista,
    px: (x) => ((x - vista.x0) / anchoX) * ancho,
    py: (y) => alto - ((y - vista.y0) / altoY) * alto,
    ux: (px) => vista.x0 + (px / ancho) * anchoX,
    uy: (py) => vista.y0 + ((alto - py) / alto) * altoY,
  };
}

/** Recorta un progreso parcial dentro de una fase de la animación. */
function tramo(t, desde, hasta) {
  if (hasta <= desde) return t >= hasta ? 1 : 0;
  return Math.min(1, Math.max(0, (t - desde) / (hasta - desde)));
}

/** Suavizado para que las rectas no arranquen y paren de golpe. */
function suave(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function conAlfa(c, alfa, pintar) {
  const previo = c.globalAlpha;
  c.globalAlpha = previo * alfa;
  pintar();
  c.globalAlpha = previo;
}

function evaluarSeguro(f, x) {
  if (!f) return NaN;
  try {
    const y = f(x);
    return typeof y === 'number' ? y : NaN;
  } catch {
    return NaN;
  }
}

// ------------------------------------------------------------------- papel

/** Papel milimetrado: fondo, rejilla fina y gruesa, ejes y etiquetas. */
function dibujarPapel(c, T, tema) {
  const { ancho, alto, vista } = T;

  c.fillStyle = tema.papel;
  c.fillRect(0, 0, ancho, alto);

  // Paso "bonito" calculado para que la rejilla fina quede en unos 12 px.
  const pasoFinoX = pasoBonito((vista.x1 - vista.x0) / (ancho / 12));
  const pasoFinoY = pasoBonito((vista.y1 - vista.y0) / (alto / 12));
  const pasoGruesoX = pasoFinoX * 5;
  const pasoGruesoY = pasoFinoY * 5;

  // El bucle va por índice y con tope: si la ventana está tan acercada que
  // sumar el paso ya no cambia el valor (absorción de coma flotante), un bucle
  // con acumulador no terminaría nunca.
  const TOPE_LINEAS = 400;
  const lineas = (paso, color, grosor, vertical) => {
    const desde = Math.ceil((vertical ? vista.x0 : vista.y0) / paso) * paso;
    const hasta = vertical ? vista.x1 : vista.y1;
    c.strokeStyle = color;
    c.lineWidth = grosor;
    c.beginPath();
    for (let i = 0; i < TOPE_LINEAS; i++) {
      const valor = desde + paso * i;
      if (valor > hasta) break;
      if (vertical) {
        const px = Math.round(T.px(valor)) + 0.5;
        c.moveTo(px, 0);
        c.lineTo(px, alto);
      } else {
        const py = Math.round(T.py(valor)) + 0.5;
        c.moveTo(0, py);
        c.lineTo(ancho, py);
      }
    }
    c.stroke();
  };

  lineas(pasoFinoX, tema.rejillaFina, 1, true);
  lineas(pasoFinoY, tema.rejillaFina, 1, false);
  lineas(pasoGruesoX, tema.rejillaGruesa, 1, true);
  lineas(pasoGruesoY, tema.rejillaGruesa, 1, false);

  // Ejes
  c.strokeStyle = tema.tinta;
  c.lineWidth = 1.5;
  c.beginPath();
  if (vista.y0 <= 0 && vista.y1 >= 0) {
    const py = Math.round(T.py(0)) + 0.5;
    c.moveTo(0, py);
    c.lineTo(ancho, py);
  }
  if (vista.x0 <= 0 && vista.x1 >= 0) {
    const px = Math.round(T.px(0)) + 0.5;
    c.moveTo(px, 0);
    c.lineTo(px, alto);
  }
  c.stroke();

  // Etiquetas sobre las líneas gruesas
  c.font = FUENTE;
  c.fillStyle = tema.tintaSuave;
  c.textAlign = 'center';
  c.textBaseline = 'top';
  const yEje = vista.y0 <= 0 && vista.y1 >= 0 ? T.py(0) : alto;
  const desdeX = Math.ceil(vista.x0 / pasoGruesoX) * pasoGruesoX;
  for (let i = 0; i < 200; i++) {
    const x = desdeX + pasoGruesoX * i;
    if (x > vista.x1) break;
    if (Math.abs(x) < pasoGruesoX / 2) continue;
    const py = Math.min(alto - 4, Math.max(12, yEje + 4));
    c.fillText(ejeLabel(x, pasoGruesoX), T.px(x), py);
  }

  c.textAlign = 'right';
  c.textBaseline = 'middle';
  const xEje = vista.x0 <= 0 && vista.x1 >= 0 ? T.px(0) : 0;
  const desdeY = Math.ceil(vista.y0 / pasoGruesoY) * pasoGruesoY;
  for (let i = 0; i < 200; i++) {
    const y = desdeY + pasoGruesoY * i;
    if (y > vista.y1) break;
    if (Math.abs(y) < pasoGruesoY / 2) continue;
    const px = Math.min(ancho - 4, Math.max(28, xEje - 6));
    c.fillText(ejeLabel(y, pasoGruesoY), px, T.py(y));
  }
}

// ------------------------------------------------------------------- curvas

/**
 * Dibuja una función muestreándola píxel a píxel.
 *
 * El trazo se corta cuando el valor deja de ser finito o cuando el salto entre
 * dos píxeles vecinos es tan grande que solo puede ser una asíntota: así no
 * aparecen rectas verticales falsas en tan(x) o 1/x.
 */
function dibujarFuncion(c, T, f, color, grosor = 2) {
  if (!f) return;
  const { ancho, alto } = T;
  const salto = alto * 2;

  c.strokeStyle = color;
  c.lineWidth = grosor;
  c.lineJoin = 'round';
  c.beginPath();

  let dibujando = false;
  let pyAnterior = NaN;
  for (let px = 0; px <= ancho; px++) {
    const y = evaluarSeguro(f, T.ux(px));
    if (!Number.isFinite(y)) {
      dibujando = false;
      pyAnterior = NaN;
      continue;
    }
    const py = T.py(y);
    // Fuera del lienzo con un margen: se sigue trazando para que entre y salga
    // bien, pero un salto enorme rompe el trazo.
    if (dibujando && Number.isFinite(pyAnterior) && Math.abs(py - pyAnterior) > salto) {
      dibujando = false;
    }
    if (dibujando) {
      c.lineTo(px, py);
    } else {
      c.moveTo(px, py);
      dibujando = true;
    }
    pyAnterior = py;
  }
  c.stroke();
}

/** Recta y = x, que es la referencia del método de punto fijo. */
function dibujarIdentidad(c, T, tema) {
  c.save();
  c.strokeStyle = tema.tintaSuave;
  c.lineWidth = 1;
  c.setLineDash([5, 4]);
  c.beginPath();
  c.moveTo(T.px(T.vista.x0), T.py(T.vista.x0));
  c.lineTo(T.px(T.vista.x1), T.py(T.vista.x1));
  c.stroke();
  c.restore();
}

// ------------------------------------------------------------- piezas sueltas

function punto(c, T, x, y, color, radio = 4) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(T.px(x), T.py(y), radio, 0, Math.PI * 2);
  c.fill();
}

function circuloHueco(c, T, x, y, color, radio = 4.5) {
  c.strokeStyle = color;
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(T.px(x), T.py(y), radio, 0, Math.PI * 2);
  c.stroke();
}

/** Línea de puntos desde (x, y) hasta el eje, para situar el punto. */
function caida(c, T, x, y, color) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = 1;
  c.setLineDash([3, 3]);
  c.beginPath();
  c.moveTo(T.px(x), T.py(y));
  c.lineTo(T.px(x), T.py(0));
  c.stroke();
  c.restore();
}

/** Marca vertical en el eje, como las de una regla. */
function marcaEje(c, T, x, color, alto = 7) {
  const px = T.px(x);
  const py = T.py(0);
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(px, py - alto);
  c.lineTo(px, py + alto);
  c.stroke();
}

/** Etiqueta con subíndice Unicode: x₀, x₁, xᵣ… */
function etiqueta(c, T, x, y, texto, color, desplazamiento = -12) {
  c.font = FUENTE_ETIQUETA;
  c.fillStyle = color;
  c.textAlign = 'center';
  c.textBaseline = 'bottom';
  const px = Math.min(T.ancho - 14, Math.max(14, T.px(x)));
  const py = Math.min(T.alto - 4, Math.max(14, T.py(y) + desplazamiento));
  c.fillText(texto, px, py);
}

/** Segmento que crece de (x1,y1) a (x2,y2) según el progreso. */
function segmentoCreciente(c, T, x1, y1, x2, y2, progreso, color, grosor = 2) {
  const p = suave(Math.min(1, Math.max(0, progreso)));
  if (p <= 0) return;
  c.strokeStyle = color;
  c.lineWidth = grosor;
  c.beginPath();
  c.moveTo(T.px(x1), T.py(y1));
  c.lineTo(T.px(x1 + (x2 - x1) * p), T.py(y1 + (y2 - y1) * p));
  c.stroke();
}

/** Mira de diana sobre la raíz, cuando el método converge. */
function diana(c, T, x, tema) {
  const px = T.px(x);
  const py = T.py(0);
  c.save();
  c.strokeStyle = tema.marca;
  c.lineWidth = 1.5;
  for (const r of [5, 10, 15]) {
    c.beginPath();
    c.arc(px, py, r, 0, Math.PI * 2);
    c.stroke();
  }
  c.beginPath();
  c.moveTo(px - 20, py);
  c.lineTo(px + 20, py);
  c.moveTo(px, py - 20);
  c.lineTo(px, py + 20);
  c.stroke();
  c.restore();
}

// ------------------------------------------------------- animación por método

/**
 * Dibuja el paso actual del método.
 *
 * @param {object} args datos del paso: iteración, método, progreso y funciones
 */
function dibujarPaso(c, T, tema, { metodo, iteracion, iteraciones, paso, t, f, g }) {
  if (!iteracion) return;
  const v = iteracion.valores ?? {};
  const n = iteracion.n;

  switch (metodo) {
    case 'biseccion':
    case 'falsa_posicion': {
      const { a, b, xr, fa, fb } = v;
      if (a == null || b == null) return;

      // Banda sombreada del intervalo vivo.
      const aparicion = tramo(t, 0, 0.3);
      conAlfa(c, 0.1 * aparicion, () => {
        c.fillStyle = tema.marca;
        c.fillRect(T.px(a), 0, T.px(b) - T.px(a), T.alto);
      });
      conAlfa(c, aparicion, () => {
        c.save();
        c.strokeStyle = tema.marca;
        c.lineWidth = 1;
        c.setLineDash([2, 4]);
        for (const x of [a, b]) {
          c.beginPath();
          c.moveTo(T.px(x), 0);
          c.lineTo(T.px(x), T.alto);
          c.stroke();
        }
        c.restore();
        if (fa != null) {
          caida(c, T, a, fa, tema.tintaSuave);
          punto(c, T, a, fa, tema.marca);
          etiqueta(c, T, a, fa, 'a', tema.marca);
        }
        if (fb != null) {
          caida(c, T, b, fb, tema.tintaSuave);
          punto(c, T, b, fb, tema.marca);
          etiqueta(c, T, b, fb, 'b', tema.marca);
        }
      });

      const avance = tramo(t, 0.25, 0.75);
      if (metodo === 'falsa_posicion' && fa != null && fb != null) {
        // La cuerda crece de (a, fa) a (b, fb).
        segmentoCreciente(c, T, a, fa, b, fb, avance, tema.marca, 2);
      } else if (xr != null) {
        // Dos segmentos que avanzan desde los extremos hacia el punto medio.
        segmentoCreciente(c, T, a, 0, xr, 0, avance, tema.marca, 3);
        segmentoCreciente(c, T, b, 0, xr, 0, avance, tema.marca, 3);
      }

      const salida = tramo(t, 0.7, 1);
      if (xr != null && salida > 0) {
        conAlfa(c, salida, () => {
          const fxr = v.fxr;
          if (fxr != null) {
            caida(c, T, xr, fxr, tema.marca);
            punto(c, T, xr, fxr, tema.marca, 3.5);
          }
          marcaEje(c, T, xr, tema.marca);
          punto(c, T, xr, 0, tema.marca, 4.5);
          etiqueta(c, T, xr, 0, `x${subindice(n)}`, tema.marca, -14);
        });
      }
      break;
    }

    case 'newton': {
      const { xi, fxi, dfxi, xi1 } = v;
      if (xi == null || fxi == null || dfxi == null) return;

      // La tangente completa, muy tenue, para ver su inclinación.
      conAlfa(c, 0.3 * tramo(t, 0, 0.25), () => {
        c.save();
        c.strokeStyle = tema.marca;
        c.lineWidth = 1;
        c.setLineDash([6, 5]);
        const yEn = (x) => fxi + dfxi * (x - xi);
        c.beginPath();
        c.moveTo(T.px(T.vista.x0), T.py(yEn(T.vista.x0)));
        c.lineTo(T.px(T.vista.x1), T.py(yEn(T.vista.x1)));
        c.stroke();
        c.restore();
      });

      conAlfa(c, tramo(t, 0, 0.3), () => {
        caida(c, T, xi, fxi, tema.tintaSuave);
        punto(c, T, xi, fxi, tema.marca);
        etiqueta(c, T, xi, fxi, `x${subindice(n - 1)}`, tema.marca);
        circuloHueco(c, T, xi, 0, tema.marca);
      });

      if (xi1 != null) {
        segmentoCreciente(c, T, xi, fxi, xi1, 0, tramo(t, 0.25, 0.8), tema.marca, 2.5);
        conAlfa(c, tramo(t, 0.75, 1), () => {
          marcaEje(c, T, xi1, tema.marca);
          punto(c, T, xi1, 0, tema.marca, 4.5);
          etiqueta(c, T, xi1, 0, `x${subindice(n)}`, tema.marca, -14);
        });
      }
      break;
    }

    case 'secante':
    case 'steffensen': {
      // Los dos puntos por los que pasa la recta tienen nombres distintos en
      // cada método, pero el dibujo es el mismo.
      const p1x = metodo === 'secante' ? v.xim1 : v.xi;
      const p1y = metodo === 'secante' ? v.fxim1 : v.fxi;
      const p2x = metodo === 'secante' ? v.xi : v.z;
      const p2y = metodo === 'secante' ? v.fxi : v.fxifx;
      const xi1 = v.xi1;
      if (p1x == null || p1y == null || p2x == null || p2y == null) return;

      conAlfa(c, tramo(t, 0, 0.3), () => {
        caida(c, T, p1x, p1y, tema.tintaSuave);
        caida(c, T, p2x, p2y, tema.tintaSuave);
        punto(c, T, p1x, p1y, tema.marca);
        punto(c, T, p2x, p2y, tema.marca);
        etiqueta(c, T, p1x, p1y, metodo === 'secante' ? `x${subindice(n - 1)}` : 'x', tema.marca);
        etiqueta(c, T, p2x, p2y, metodo === 'secante' ? `x${subindice(n)}` : 'z', tema.marca);
      });

      if (xi1 != null) {
        // La recta crece de un punto al otro y sigue hasta cortar el eje.
        const avance = tramo(t, 0.2, 0.8);
        const dx = p2x - p1x;
        const dy = p2y - p1y;
        if (dx !== 0 || dy !== 0) {
          // Se extiende el segmento hasta el corte con el eje.
          const fin = dy === 0 ? p2x : p1x - (p1y * dx) / dy;
          const finY = 0;
          segmentoCreciente(c, T, p1x, p1y, fin, finY, avance, tema.marca, 2.5);
        }
        conAlfa(c, tramo(t, 0.75, 1), () => {
          marcaEje(c, T, xi1, tema.marca);
          punto(c, T, xi1, 0, tema.marca, 4.5);
          etiqueta(c, T, xi1, 0, `x${subindice(n)}`, tema.marca, -14);
        });
      }
      break;
    }

    case 'punto_fijo': {
      const { xi, gxi } = v;
      if (xi == null || gxi == null) return;

      // Telaraña de los pasos anteriores, apagada.
      conAlfa(c, 0.25, () => {
        c.strokeStyle = tema.marca;
        c.lineWidth = 1;
        c.beginPath();
        for (let k = 0; k < paso; k++) {
          const previo = iteraciones[k]?.valores ?? {};
          if (previo.xi == null || previo.gxi == null) continue;
          c.moveTo(T.px(previo.xi), T.py(previo.xi));
          c.lineTo(T.px(previo.xi), T.py(previo.gxi));
          c.lineTo(T.px(previo.gxi), T.py(previo.gxi));
        }
        c.stroke();
      });

      // Paso actual: vertical hasta g, horizontal hasta y = x.
      const vertical = tramo(t, 0.05, 0.5);
      const horizontal = tramo(t, 0.45, 0.9);
      segmentoCreciente(c, T, xi, xi, xi, gxi, vertical, tema.marca, 2.5);
      if (horizontal > 0) {
        segmentoCreciente(c, T, xi, gxi, gxi, gxi, horizontal, tema.marca, 2.5);
      }

      conAlfa(c, tramo(t, 0.3, 0.6), () => {
        punto(c, T, xi, gxi, tema.curvaG);
        etiqueta(c, T, xi, gxi, `g(x${subindice(n - 1)})`, tema.curvaG);
      });
      conAlfa(c, tramo(t, 0.85, 1), () => {
        marcaEje(c, T, gxi, tema.marca);
        punto(c, T, gxi, 0, tema.marca, 4.5);
        etiqueta(c, T, gxi, 0, `x${subindice(n)}`, tema.marca, -14);
      });
      break;
    }

    case 'muller': {
      const { x0, x1, x2, x3, pa, pb, pc } = v;
      if (x0 == null || x1 == null || x2 == null) return;

      conAlfa(c, tramo(t, 0, 0.3), () => {
        [[x0, 0], [x1, 1], [x2, 2]].forEach(([x, idx]) => {
          const y = evaluarSeguro(f, x);
          if (Number.isFinite(y)) {
            caida(c, T, x, y, tema.tintaSuave);
            punto(c, T, x, y, tema.marca);
            etiqueta(c, T, x, y, `x${subindice(idx)}`, tema.marca);
          }
        });
      });

      // La parábola aparece con fade, dibujada a trazos.
      if (pa != null && pb != null && pc != null) {
        conAlfa(c, 0.9 * tramo(t, 0.25, 0.75), () => {
          c.save();
          c.strokeStyle = tema.marca;
          c.lineWidth = 1.8;
          c.setLineDash([6, 4]);
          c.beginPath();
          for (let px = 0; px <= T.ancho; px++) {
            const x = T.ux(px);
            const d = x - x2;
            const y = pa * d * d + pb * d + pc;
            if (px === 0) c.moveTo(px, T.py(y));
            else c.lineTo(px, T.py(y));
          }
          c.stroke();
          c.restore();
        });
      }

      if (x3 != null) {
        conAlfa(c, tramo(t, 0.7, 1), () => {
          marcaEje(c, T, x3, tema.marca);
          punto(c, T, x3, 0, tema.marca, 4.5);
          etiqueta(c, T, x3, 0, `x${subindice(n + 2)}`, tema.marca, -14);
        });
      }
      break;
    }

    default:
      break;
  }
}

/** Rastro de estimaciones anteriores: círculos huecos cada vez más opacos. */
function dibujarRastro(c, T, iteraciones, paso, tema) {
  for (let k = 0; k < paso; k++) {
    const x = iteraciones[k]?.x;
    if (x == null) continue;
    const alfa = 0.15 + 0.5 * ((k + 1) / Math.max(1, paso));
    conAlfa(c, alfa, () => circuloHueco(c, T, x, 0, tema.marca, 4));
  }
}

// ------------------------------------------------------------------- lectura

/** Cruz y etiqueta con los valores de x y f(x) bajo el cursor. */
function dibujarLectura(c, T, cursor, f, tema) {
  if (!cursor) return;
  const x = T.ux(cursor.px);
  const y = evaluarSeguro(f, x);

  c.save();
  c.strokeStyle = tema.tintaSuave;
  c.lineWidth = 1;
  c.setLineDash([2, 3]);
  c.beginPath();
  c.moveTo(cursor.px, 0);
  c.lineTo(cursor.px, T.alto);
  c.stroke();
  c.restore();

  if (Number.isFinite(y)) {
    punto(c, T, x, y, tema.curva, 3.5);
  }

  const texto = `x = ${ejeLabel(x, (T.vista.x1 - T.vista.x0) / 400)}`
    + `   f(x) = ${Number.isFinite(y) ? ejeLabel(y, (T.vista.y1 - T.vista.y0) / 400) : '—'}`;
  c.font = FUENTE;
  const ancho = c.measureText(texto).width + 12;
  const px = Math.min(T.ancho - ancho - 6, Math.max(6, cursor.px + 10));

  c.fillStyle = tema.papel;
  c.globalAlpha = 0.9;
  c.fillRect(px, 6, ancho, 20);
  c.globalAlpha = 1;
  c.strokeStyle = tema.tinta;
  c.lineWidth = 1;
  c.strokeRect(px + 0.5, 6.5, ancho, 20);
  c.fillStyle = tema.tinta;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(texto, px + 6, 17);
}

/** Leyenda de las curvas dibujadas. */
function dibujarLeyenda(c, T, entradas, tema) {
  if (entradas.length === 0) return;
  c.font = FUENTE;
  c.textAlign = 'left';
  c.textBaseline = 'middle';

  const anchoCaja = Math.max(...entradas.map((e) => c.measureText(e.texto).width)) + 34;
  const altoCaja = entradas.length * 18 + 10;
  const x = T.ancho - anchoCaja - 8;
  const y = T.alto - altoCaja - 8;

  c.globalAlpha = 0.92;
  c.fillStyle = tema.papel;
  c.fillRect(x, y, anchoCaja, altoCaja);
  c.globalAlpha = 1;
  c.strokeStyle = tema.tinta;
  c.lineWidth = 1;
  c.strokeRect(x + 0.5, y + 0.5, anchoCaja, altoCaja);

  entradas.forEach((entrada, i) => {
    const cy = y + 14 + i * 18;
    c.strokeStyle = entrada.color;
    c.lineWidth = 2.5;
    c.setLineDash(entrada.trazos ?? []);
    c.beginPath();
    c.moveTo(x + 8, cy);
    c.lineTo(x + 26, cy);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = tema.tinta;
    c.fillText(entrada.texto, x + 32, cy);
  });
}

// -------------------------------------------------------------------- escena

/**
 * Pinta el lienzo completo.
 *
 * @param {CanvasRenderingContext2D} c contexto 2D, ya escalado al devicePixelRatio
 * @param {object} args estado a dibujar
 */
export function dibujarEscena(c, args) {
  const {
    ancho, alto, vista, tema,
    f, g, resultado, paso = -1, t = 1,
    cursor = null, nombreFuncion = 'f(x)', nombreG = 'g(x)',
  } = args;

  const T = crearTransformacion(vista, ancho, alto);
  const esPuntoFijo = resultado?.metodo === 'punto_fijo';

  dibujarPapel(c, T, tema);

  const leyenda = [];
  if (esPuntoFijo && g) {
    // En punto fijo lo que importa es g(x) contra la recta y = x.
    dibujarIdentidad(c, T, tema);
    dibujarFuncion(c, T, g, tema.curvaG, 2.2);
    conAlfa(c, 0.45, () => dibujarFuncion(c, T, f, tema.curva, 1.5));
    leyenda.push({ texto: nombreG, color: tema.curvaG });
    leyenda.push({ texto: 'y = x', color: tema.tintaSuave, trazos: [5, 4] });
    leyenda.push({ texto: nombreFuncion, color: tema.curva });
  } else {
    dibujarFuncion(c, T, f, tema.curva, 2.2);
    leyenda.push({ texto: nombreFuncion, color: tema.curva });
  }

  if (resultado && paso >= 0 && resultado.iteraciones?.[paso]) {
    dibujarRastro(c, T, resultado.iteraciones, paso, tema);
    dibujarPaso(c, T, tema, {
      metodo: resultado.metodo,
      iteraciones: resultado.iteraciones,
      iteracion: resultado.iteraciones[paso],
      paso,
      t,
      f,
      g,
    });
    leyenda.push({ texto: 'iteración', color: tema.marca });

    const esUltimo = paso === resultado.iteraciones.length - 1;
    if (esUltimo && resultado.convergio && resultado.raiz != null && t >= 0.99) {
      diana(c, T, resultado.raiz, tema);
    }
  }

  dibujarLectura(c, T, cursor, esPuntoFijo && g ? g : f, tema);
  dibujarLeyenda(c, T, leyenda, tema);
}
