package com.analisis.raices.expresion;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Pruebas del parser: precedencias, multiplicación implícita y mensajes de error. */
class ExpresionTest {

  private static final double EPS = 1e-12;

  private static double ev(String texto, double x) {
    return Expresion.evaluar(texto, x);
  }

  @Test
  @DisplayName("La potencia funciona y es asociativa a la derecha")
  void potencias() {
    assertEquals(8.0, ev("2^3", 0), EPS);
    assertEquals(8.0, ev("2**3", 0), EPS);
    assertEquals(512.0, ev("2^3^2", 0), EPS); // 2^(3^2), no (2^3)^2
    assertEquals(0.25, ev("2^-2", 0), EPS);
  }

  @Test
  @DisplayName("El menos unario se aplica después de la potencia: -x^2 = -(x^2)")
  void menosUnario() {
    assertEquals(-4.0, ev("-x^2", 2), EPS);
    assertEquals(4.0, ev("(-x)^2", 2), EPS);
  }

  @Test
  @DisplayName("Multiplicación implícita: 3x^2, 2x, 3(x+1), x sen(x)")
  void multiplicacionImplicita() {
    assertEquals(12.0, ev("3x^2", 2), EPS);
    assertEquals(4.0, ev("2x", 2), EPS);
    assertEquals(9.0, ev("3(x+1)", 2), EPS);
    assertEquals(Math.PI / 2, ev("x sen(x)", Math.PI / 2), EPS);
    assertEquals(Math.PI / 2, ev("x sin(x)", Math.PI / 2), EPS);
  }

  @Test
  @DisplayName("Notación científica solo cuando tras la 'e' viene un número")
  void notacionCientifica() {
    assertEquals(0.001, ev("1e-3", 0), EPS);
    assertEquals(1500.0, ev("1.5e3", 0), EPS);
    assertEquals(0.002, ev("2E-3", 0), EPS);
    // Aquí la 'e' es la constante de Euler: 2e^x = 2 * e^x
    assertEquals(2 * Math.E, ev("2e^x", 1), EPS);
    assertEquals(2.0, ev("2e^x", 0), EPS);
  }

  @Test
  @DisplayName("Logaritmos: log natural, log(x, base), log10 y log2")
  void logaritmos() {
    assertEquals(3.0, ev("log(8, 2)", 0), 1e-12);
    assertEquals(1.0, ev("log(e)", 0), EPS);
    assertEquals(1.0, ev("ln(e)", 0), EPS);
    assertEquals(2.0, ev("log10(100)", 0), EPS);
    assertEquals(5.0, ev("log2(32)", 0), EPS);
  }

  @Test
  @DisplayName("Constantes, corchetes y funciones variadas")
  void constantesYFunciones() {
    assertEquals(0.0, ev("sen(pi)", 0), 1e-15);
    assertEquals(-1.0, ev("cos(pi)", 0), EPS);
    assertEquals(9.0, ev("[x+1]^2", 2), EPS);
    assertEquals(3.0, ev("sqrt(9)", 0), EPS);
    assertEquals(2.0, ev("cbrt(8)", 0), EPS);
    assertEquals(5.0, ev("abs(-5)", 0), EPS);
    assertEquals(1.0, ev("tg(pi/4)", 0), 1e-15);
    assertEquals(2.0, ev("sec(0) + 1", 0), EPS);
  }

  @Test
  @DisplayName("Las expresiones de los ejemplos de la interfaz se compilan")
  void ejemplosDeLaInterfaz() {
    assertEquals(-2.0, ev("x^3 - x - 2", 0), EPS);
    assertEquals(-10.0, ev("x^3 + 4x^2 - 10", 0), EPS);
    assertEquals(1.0, ev("cos(x) - x", 0), EPS);
    assertEquals(1.0, ev("e^(-x) - x", 0), EPS);
    assertEquals(-1.0, ev("x sen(x) - 1", 0), EPS);
    assertEquals(-1.0, ev("ln(x) + x - 2", 1), EPS);
    assertEquals(2.0, ev("cbrt(x+2)", 6), EPS);
    assertEquals(1.0, ev("1/sen(pi/2)", 0), EPS);
  }

  @Test
  @DisplayName("El signo menos tipográfico que se copia y pega también sirve")
  void menosTipografico() {
    assertEquals(-2.0, ev("x^3 − x − 2", 0), EPS);
  }

  @Test
  @DisplayName("Falta cerrar un paréntesis")
  void parentesisSinCerrar() {
    ErrorExpresion e = assertThrows(ErrorExpresion.class, () -> ev("(x+1", 0));
    assertEquals("Falta cerrar un paréntesis", e.getMessage());
  }

  @Test
  @DisplayName("Paréntesis de cierre de más")
  void parentesisDeMas() {
    ErrorExpresion e = assertThrows(ErrorExpresion.class, () -> ev("x+1)", 0));
    assertEquals("Hay un paréntesis de cierre de más", e.getMessage());
  }

  @Test
  @DisplayName("Variable desconocida")
  void variableDesconocida() {
    ErrorExpresion e = assertThrows(ErrorExpresion.class, () -> ev("y + 1", 0));
    assertEquals("Variable o constante desconocida: 'y'. Usa x como variable", e.getMessage());
  }

  @Test
  @DisplayName("Carácter no válido")
  void caracterNoValido() {
    ErrorExpresion e = assertThrows(ErrorExpresion.class, () -> ev("x $ 2", 0));
    assertEquals("Carácter no válido: '$'", e.getMessage());
  }

  @Test
  @DisplayName("Operador sin operando y expresión vacía")
  void sintaxisIncompleta() {
    assertThrows(ErrorExpresion.class, () -> ev("x +", 0));
    assertThrows(ErrorExpresion.class, () -> ev("* 2", 0));
    assertThrows(ErrorExpresion.class, () -> ev("", 0));
    assertThrows(ErrorExpresion.class, () -> ev("   ", 0));
  }

  @Test
  @DisplayName("Una función sin paréntesis o con argumentos de más avisa")
  void funcionMalUsada() {
    ErrorExpresion sinParentesis = assertThrows(ErrorExpresion.class, () -> ev("sen", 0));
    assertTrue(sinParentesis.getMessage().contains("necesita paréntesis"));
    ErrorExpresion sobranArgs = assertThrows(ErrorExpresion.class, () -> ev("cos(1, 2)", 0));
    assertTrue(sobranArgs.getMessage().contains("espera 1 argumento"));
  }
}
