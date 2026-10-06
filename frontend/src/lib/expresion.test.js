/**
 * Mismas pruebas que ExpresionTest.java, para asegurar que el parser del
 * navegador y el del servidor leen las expresiones igual.
 */

import { describe, expect, it } from 'vitest';
import { compilar, evaluar, intentarCompilar } from './expresion.js';

const EPS = 1e-12;
const ev = (texto, x) => evaluar(texto, x);

describe('parser de expresiones', () => {
  it('la potencia funciona y es asociativa a la derecha', () => {
    expect(ev('2^3', 0)).toBeCloseTo(8, 12);
    expect(ev('2**3', 0)).toBeCloseTo(8, 12);
    expect(ev('2^3^2', 0)).toBeCloseTo(512, 12); // 2^(3^2), no (2^3)^2
    expect(ev('2^-2', 0)).toBeCloseTo(0.25, 12);
  });

  it('el menos unario se aplica después de la potencia: -x^2 = -(x^2)', () => {
    expect(ev('-x^2', 2)).toBeCloseTo(-4, 12);
    expect(ev('(-x)^2', 2)).toBeCloseTo(4, 12);
  });

  it('multiplicación implícita: 3x^2, 2x, 3(x+1), x sen(x)', () => {
    expect(ev('3x^2', 2)).toBeCloseTo(12, 12);
    expect(ev('2x', 2)).toBeCloseTo(4, 12);
    expect(ev('3(x+1)', 2)).toBeCloseTo(9, 12);
    expect(ev('x sen(x)', Math.PI / 2)).toBeCloseTo(Math.PI / 2, 12);
    expect(ev('x sin(x)', Math.PI / 2)).toBeCloseTo(Math.PI / 2, 12);
  });

  it("notación científica solo cuando tras la 'e' viene un número", () => {
    expect(ev('1e-3', 0)).toBeCloseTo(0.001, 12);
    expect(ev('1.5e3', 0)).toBeCloseTo(1500, 12);
    expect(ev('2E-3', 0)).toBeCloseTo(0.002, 12);
    // Aquí la 'e' es la constante de Euler: 2e^x = 2 * e^x
    expect(ev('2e^x', 1)).toBeCloseTo(2 * Math.E, 12);
    expect(ev('2e^x', 0)).toBeCloseTo(2, 12);
  });

  it('logaritmos: natural, log(x, base), log10 y log2', () => {
    expect(ev('log(8, 2)', 0)).toBeCloseTo(3, 12);
    expect(ev('log(e)', 0)).toBeCloseTo(1, 12);
    expect(ev('ln(e)', 0)).toBeCloseTo(1, 12);
    expect(ev('log10(100)', 0)).toBeCloseTo(2, 12);
    expect(ev('log2(32)', 0)).toBeCloseTo(5, 12);
  });

  it('constantes, corchetes y funciones variadas', () => {
    expect(Math.abs(ev('sen(pi)', 0))).toBeLessThan(1e-15);
    expect(ev('cos(pi)', 0)).toBeCloseTo(-1, 12);
    expect(ev('[x+1]^2', 2)).toBeCloseTo(9, 12);
    expect(ev('sqrt(9)', 0)).toBeCloseTo(3, 12);
    expect(ev('cbrt(8)', 0)).toBeCloseTo(2, 12);
    expect(ev('abs(-5)', 0)).toBeCloseTo(5, 12);
    expect(ev('tg(pi/4)', 0)).toBeCloseTo(1, 12);
    expect(ev('sec(0) + 1', 0)).toBeCloseTo(2, 12);
  });

  it('las expresiones de los ejemplos de la interfaz se compilan', () => {
    expect(ev('x^3 - x - 2', 0)).toBeCloseTo(-2, 12);
    expect(ev('x^3 + 4x^2 - 10', 0)).toBeCloseTo(-10, 12);
    expect(ev('cos(x) - x', 0)).toBeCloseTo(1, 12);
    expect(ev('e^(-x) - x', 0)).toBeCloseTo(1, 12);
    expect(ev('x sen(x) - 1', 0)).toBeCloseTo(-1, 12);
    expect(ev('ln(x) + x - 2', 1)).toBeCloseTo(-1, 12);
    expect(ev('cbrt(x+2)', 6)).toBeCloseTo(2, 12);
    expect(ev('sqrt(10/(x+4))', 1)).toBeCloseTo(Math.sqrt(2), 12);
    expect(ev('1/sen(x)', Math.PI / 2)).toBeCloseTo(1, 12);
    expect(ev('2-ln(x)', 1)).toBeCloseTo(2, 12);
  });

  it('el signo menos tipográfico que se copia y pega también sirve', () => {
    expect(ev('x^3 − x − 2', 0)).toBeCloseTo(-2, 12);
  });

  it('avisa cuando falta cerrar un paréntesis', () => {
    expect(() => ev('(x+1', 0)).toThrow('Falta cerrar un paréntesis');
  });

  it('avisa cuando sobra un paréntesis de cierre', () => {
    expect(() => ev('x+1)', 0)).toThrow('Hay un paréntesis de cierre de más');
  });

  it('avisa de variables desconocidas', () => {
    expect(() => ev('y + 1', 0)).toThrow(
      "Variable o constante desconocida: 'y'. Usa x como variable",
    );
  });

  it('avisa de caracteres no válidos', () => {
    expect(() => ev('x $ 2', 0)).toThrow("Carácter no válido: '$'");
  });

  it('avisa de sintaxis incompleta', () => {
    expect(() => ev('x +', 0)).toThrow();
    expect(() => ev('* 2', 0)).toThrow();
    expect(() => ev('', 0)).toThrow();
    expect(() => ev('   ', 0)).toThrow();
  });

  it('avisa cuando una función se usa mal', () => {
    expect(() => ev('sen', 0)).toThrow('necesita paréntesis');
    expect(() => ev('cos(1, 2)', 0)).toThrow('espera 1 argumento');
  });

  it('compilar devuelve una función reutilizable', () => {
    const f = compilar('x^2 - 2');
    expect(f(0)).toBeCloseTo(-2, 12);
    expect(f(2)).toBeCloseTo(2, 12);
    expect(f(Math.SQRT2)).toBeLessThan(EPS);
  });

  it('intentarCompilar no lanza y describe el error', () => {
    const bien = intentarCompilar('x^2 - 2');
    expect(bien.error).toBeNull();
    expect(bien.fn(3)).toBe(7);

    const mal = intentarCompilar('x^2 - ');
    expect(mal.fn).toBeNull();
    expect(typeof mal.error).toBe('string');
    expect(mal.error.length).toBeGreaterThan(0);
  });
});
