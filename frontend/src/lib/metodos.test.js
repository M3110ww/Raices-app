/**
 * Mismas pruebas que MetodosTest.java, con los MISMOS números de iteraciones.
 *
 * Es la red de seguridad de la promesa del proyecto: el motor del navegador y
 * el de Java tienen que dar resultados idénticos.
 */

import { describe, expect, it } from 'vitest';
import { METODOS, buscarMetodo, esCerrado, resolverLocal } from './metodos.js';

const RAIZ2 = Math.sqrt(2);
const TOL = 1e-10;

/** Solicitud con f(x) = x² − 2, tolerancia 1e-10 y error absoluto. */
function raiz2(metodo, extra = {}) {
  return {
    metodo,
    funcion: 'x^2 - 2',
    tolerancia: TOL,
    maxIteraciones: 200,
    tipoError: 'ABSOLUTO',
    ...extra,
  };
}

function comprobarRaiz2(r, iteracionesEsperadas) {
  expect(r.convergio, `debería converger, pero dijo: ${r.mensaje}`).toBe(true);
  expect(r.raiz).toBeCloseTo(RAIZ2, 9);
  expect(r.iteracionesRealizadas).toBe(iteracionesEsperadas);
  expect(r.iteraciones).toHaveLength(iteracionesEsperadas);
  expect(r.motor).toBe('navegador');
  expect(r.errorFinal).toBeLessThanOrEqual(TOL);
}

describe('los siete métodos buscando √2 con f(x) = x² − 2', () => {
  it('bisección en [0, 2] llega en 35 iteraciones', () => {
    comprobarRaiz2(resolverLocal(raiz2('biseccion', { a: 0, b: 2 })), 35);
  });

  it('falsa posición en [0, 2] llega en 15 iteraciones', () => {
    comprobarRaiz2(resolverLocal(raiz2('falsa_posicion', { a: 0, b: 2 })), 15);
  });

  it('punto fijo con g = (x + 2/x)/2 desde x0 = 1 llega en 5 iteraciones', () => {
    comprobarRaiz2(resolverLocal(raiz2('punto_fijo', { x0: 1, g: '(x + 2/x)/2' })), 5);
  });

  it('Newton desde x0 = 1 llega en 5 iteraciones', () => {
    comprobarRaiz2(resolverLocal(raiz2('newton', { x0: 1 })), 5);
  });

  it('secante desde 1 y 2 llega en 7 iteraciones', () => {
    comprobarRaiz2(resolverLocal(raiz2('secante', { x0: 1, x1: 2 })), 7);
  });

  it('Steffensen desde x0 = 1.5 llega en 5 iteraciones', () => {
    comprobarRaiz2(resolverLocal(raiz2('steffensen', { x0: 1.5 })), 5);
  });

  it('Müller desde 0, 1 y 2 llega en 2 iteraciones', () => {
    comprobarRaiz2(resolverLocal(raiz2('muller', { x0: 0, x1: 1, x2: 2 })), 2);
  });

  it('Newton con derivada escrita a mano también llega en 5', () => {
    comprobarRaiz2(resolverLocal(raiz2('newton', { x0: 1, derivada: '2x' })), 5);
  });
});

describe('criterio de parada', () => {
  it('bisección rechaza [2, 3] porque f no cambia de signo', () => {
    expect(() => resolverLocal(raiz2('biseccion', { a: 2, b: 3 }))).toThrow(
      /^f\(a\) y f\(b\) tienen el mismo signo/,
    );
  });

  it('bisección acepta el intervalo al revés', () => {
    comprobarRaiz2(resolverLocal(raiz2('biseccion', { a: 2, b: 0 })), 35);
  });

  it('detecta la raíz exacta cuando cae en un extremo', () => {
    const r = resolverLocal({
      metodo: 'biseccion', funcion: 'x - 1', a: 1, b: 3, tolerancia: TOL,
    });
    expect(r.convergio).toBe(true);
    expect(r.iteracionesRealizadas).toBe(1);
    expect(r.raiz).toBe(1);
    expect(r.mensaje.startsWith('Raíz exacta')).toBe(true);
  });

  it('se respeta el máximo de iteraciones', () => {
    const r = resolverLocal({
      metodo: 'biseccion', funcion: 'x^2 - 2', a: 0, b: 2, tolerancia: 1e-15, maxIteraciones: 7,
    });
    expect(r.convergio).toBe(false);
    expect(r.iteracionesRealizadas).toBe(7);
    expect(r.mensaje.startsWith('Se alcanzó el máximo de 7 iteraciones')).toBe(true);
  });

  it('un método que se escapa termina con mensaje de divergencia', () => {
    // g(x) = x^2 + 1 no tiene punto fijo real: la sucesión se va a infinito.
    const r = resolverLocal(raiz2('punto_fijo', { x0: 2, g: 'x^2 + 1' }));
    expect(r.convergio).toBe(false);
    expect(r.mensaje.startsWith('El método diverge')).toBe(true);
  });

  it('la primera iteración de bisección no tiene error y la de Newton sí', () => {
    const bis = resolverLocal(raiz2('biseccion', { a: 0, b: 2 }));
    expect(bis.iteraciones[0].error).toBeNull();
    expect(bis.iteraciones[0].n).toBe(1);

    const new1 = resolverLocal(raiz2('newton', { x0: 1 }));
    expect(new1.iteraciones[0].error).toBeCloseTo(0.5, 9);
  });

  it('bisección guarda a y b como estaban antes de recortar el intervalo', () => {
    const r = resolverLocal(raiz2('biseccion', { a: 0, b: 2 }));
    expect(r.iteraciones[0].valores).toMatchObject({ a: 0, b: 2, xr: 1 });
    expect(r.iteraciones[1].valores).toMatchObject({ a: 1, b: 2, xr: 1.5 });
  });

  it('el error residual y el relativo también sirven como criterio', () => {
    const r1 = resolverLocal(raiz2('newton', { x0: 1, tipoError: 'RESIDUAL' }));
    expect(r1.convergio).toBe(true);
    expect(r1.iteraciones[0].error).toBeGreaterThan(0);

    const r2 = resolverLocal(raiz2('newton', { x0: 1, tipoError: 'RELATIVO' }));
    expect(r2.convergio).toBe(true);
    expect(r2.iteraciones[0].error).toBeCloseTo(0.5 / 1.5, 9);
  });

  it('los valores no finitos viajan como null para que el JSON sea válido', () => {
    const r = resolverLocal({
      metodo: 'punto_fijo', funcion: 'x^2 - 2', g: 'ln(x)', x0: 0.5,
      tolerancia: TOL, maxIteraciones: 10,
    });
    expect(r.convergio).toBe(false);
    expect(r.raiz).toBeNull();
    expect(r.iteraciones.some((it) => it.fx === null || it.x === null)).toBe(true);
    expect(r.mensaje.startsWith('El método diverge')).toBe(true);
    // El JSON tiene que poder serializarse sin NaN.
    expect(() => JSON.parse(JSON.stringify(r))).not.toThrow();
    expect(JSON.stringify(r)).not.toContain('NaN');
  });
});

describe('validaciones y catálogo', () => {
  it('avisa cuando faltan datos iniciales', () => {
    expect(() => resolverLocal(raiz2('punto_fijo', { x0: 1 }))).toThrow(/g\(x\)/);
    expect(() => resolverLocal(raiz2('newton', {}))).toThrow(/x0/);
    expect(() => resolverLocal(raiz2('bairstow', { x0: 1 }))).toThrow(/^Método desconocido/);
  });

  it('rechaza tolerancias y máximos imposibles', () => {
    expect(() => resolverLocal(raiz2('newton', { x0: 1, tolerancia: 0 }))).toThrow();
    expect(() => resolverLocal(raiz2('newton', { x0: 1, maxIteraciones: 5000 }))).toThrow();
  });

  it('el catálogo expone los siete métodos en orden', () => {
    expect(METODOS.map((m) => m.id)).toEqual([
      'biseccion', 'falsa_posicion', 'punto_fijo', 'newton', 'secante', 'steffensen', 'muller',
    ]);
    expect(buscarMetodo('newton').nombre).toBe('Newton-Raphson');
    expect(esCerrado(buscarMetodo('biseccion'))).toBe(true);
    expect(esCerrado(buscarMetodo('newton'))).toBe(false);
  });

  it('cada método declara columnas y requisitos', () => {
    for (const m of METODOS) {
      expect(m.columnas.length).toBeGreaterThan(0);
      expect(m.requiere.length).toBeGreaterThan(0);
      expect(typeof m.descripcion).toBe('string');
      for (const c of m.columnas) {
        expect(typeof c.clave).toBe('string');
        expect(typeof c.etiqueta).toBe('string');
      }
    }
  });

  it('las columnas declaradas existen en los valores de cada iteración', () => {
    const casos = [
      raiz2('biseccion', { a: 0, b: 2 }),
      raiz2('falsa_posicion', { a: 0, b: 2 }),
      raiz2('punto_fijo', { x0: 1, g: '(x + 2/x)/2' }),
      raiz2('newton', { x0: 1 }),
      raiz2('secante', { x0: 1, x1: 2 }),
      raiz2('steffensen', { x0: 1.5 }),
      raiz2('muller', { x0: 0, x1: 1, x2: 2 }),
    ];
    for (const caso of casos) {
      const r = resolverLocal(caso);
      for (const col of r.columnas) {
        expect(
          Object.prototype.hasOwnProperty.call(r.iteraciones[0].valores, col.clave),
          `${r.metodo} debería traer la clave ${col.clave}`,
        ).toBe(true);
      }
    }
  });

  it('Müller guarda los coeficientes de la parábola para poder dibujarla', () => {
    const r = resolverLocal(raiz2('muller', { x0: 0, x1: 1, x2: 2 }));
    const v = r.iteraciones[0].valores;
    expect(v.pa).toBeCloseTo(1, 12);
    expect(v.pb).toBeCloseTo(4, 12);
    expect(v.pc).toBeCloseTo(2, 12);
    // pa, pb y pc no son columnas visibles.
    expect(r.columnas.map((c) => c.clave)).not.toContain('pa');
  });

  it('el resultado trae la misma forma que el JSON de la API', () => {
    const r = resolverLocal(raiz2('newton', { x0: 1 }));
    expect(Object.keys(r)).toEqual([
      'metodo', 'nombreMetodo', 'convergio', 'raiz', 'fRaiz', 'errorFinal',
      'iteracionesRealizadas', 'mensaje', 'columnas', 'iteraciones', 'tiempoMs', 'motor',
    ]);
    expect(Object.keys(r.iteraciones[0])).toEqual(['n', 'x', 'fx', 'error', 'valores']);
  });

  it('el mensaje de convergencia lleva error, tolerancia e iteraciones', () => {
    const r = resolverLocal(raiz2('newton', { x0: 1 }));
    expect(r.mensaje).toContain('Convergió en 5 iteraciones');
    expect(r.mensaje).toContain('1.000e-10');
  });
});
