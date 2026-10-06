package com.analisis.raices.metodos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.analisis.raices.modelo.Iteracion;
import com.analisis.raices.modelo.ResultadoRaiz;
import com.analisis.raices.modelo.SolicitudRaiz;
import com.analisis.raices.modelo.TipoError;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Pruebas del motor numérico.
 *
 * <p>Los siete métodos buscan √2 con f(x) = x² − 2 y tolerancia 1e-10. Los conteos de iteraciones
 * están fijados a propósito: son el contrato que el motor del navegador tiene que reproducir clavado.
 */
class MetodosTest {

  private static final double RAIZ2 = Math.sqrt(2);
  private static final double TOL = 1e-10;

  private final Resolutor resolutor = new Resolutor(new CatalogoMetodos());

  /** Solicitud con f(x) = x² − 2, tolerancia 1e-10 y error absoluto. */
  private static SolicitudRaiz raiz2(
      String metodo, String g, Double a, Double b, Double x0, Double x1, Double x2) {
    return new SolicitudRaiz(
        metodo, "x^2 - 2", g, null, a, b, x0, x1, x2, TOL, 200, TipoError.ABSOLUTO);
  }

  private void comprobarRaiz2(ResultadoRaiz r, int iteracionesEsperadas) {
    assertTrue(r.convergio(), "debería converger, pero dijo: " + r.mensaje());
    assertEquals(RAIZ2, r.raiz(), 1e-9);
    assertEquals(iteracionesEsperadas, r.iteracionesRealizadas(), "número de iteraciones");
    assertEquals(iteracionesEsperadas, r.iteraciones().size());
    assertEquals("java", r.motor());
    assertTrue(r.errorFinal() <= TOL);
  }

  @Test
  @DisplayName("Bisección en [0, 2] llega a √2 en 35 iteraciones")
  void biseccion() {
    comprobarRaiz2(
        resolutor.resolver(raiz2("biseccion", null, 0.0, 2.0, null, null, null)), 35);
  }

  @Test
  @DisplayName("Falsa posición en [0, 2] llega a √2 en 15 iteraciones")
  void falsaPosicion() {
    comprobarRaiz2(
        resolutor.resolver(raiz2("falsa_posicion", null, 0.0, 2.0, null, null, null)), 15);
  }

  @Test
  @DisplayName("Punto fijo con g = (x + 2/x)/2 desde x0 = 1 llega en 5 iteraciones")
  void puntoFijo() {
    comprobarRaiz2(
        resolutor.resolver(raiz2("punto_fijo", "(x + 2/x)/2", null, null, 1.0, null, null)), 5);
  }

  @Test
  @DisplayName("Newton desde x0 = 1 llega en 5 iteraciones")
  void newton() {
    comprobarRaiz2(resolutor.resolver(raiz2("newton", null, null, null, 1.0, null, null)), 5);
  }

  @Test
  @DisplayName("Secante desde 1 y 2 llega en 7 iteraciones")
  void secante() {
    comprobarRaiz2(resolutor.resolver(raiz2("secante", null, null, null, 1.0, 2.0, null)), 7);
  }

  @Test
  @DisplayName("Steffensen desde x0 = 1.5 llega en 5 iteraciones")
  void steffensen() {
    comprobarRaiz2(resolutor.resolver(raiz2("steffensen", null, null, null, 1.5, null, null)), 5);
  }

  @Test
  @DisplayName("Müller desde 0, 1 y 2 llega en 2 iteraciones")
  void muller() {
    comprobarRaiz2(resolutor.resolver(raiz2("muller", null, null, null, 0.0, 1.0, 2.0)), 2);
  }

  @Test
  @DisplayName("Newton con derivada escrita a mano da el mismo resultado que con la numérica")
  void newtonConDerivadaExplicita() {
    SolicitudRaiz con =
        new SolicitudRaiz(
            "newton", "x^2 - 2", null, "2x", null, null, 1.0, null, null, TOL, 200, null);
    comprobarRaiz2(resolutor.resolver(con), 5);
  }

  @Test
  @DisplayName("Bisección rechaza [2, 3] porque f no cambia de signo")
  void biseccionRechazaIntervaloSinCambioDeSigno() {
    IllegalArgumentException e =
        assertThrows(
            IllegalArgumentException.class,
            () -> resolutor.resolver(raiz2("biseccion", null, 2.0, 3.0, null, null, null)));
    assertTrue(e.getMessage().startsWith("f(a) y f(b) tienen el mismo signo"));
  }

  @Test
  @DisplayName("Bisección acepta el intervalo al revés y detecta la raíz exacta en un extremo")
  void biseccionExtremos() {
    ResultadoRaiz alReves = resolutor.resolver(raiz2("biseccion", null, 2.0, 0.0, null, null, null));
    comprobarRaiz2(alReves, 35);

    SolicitudRaiz exacta =
        new SolicitudRaiz(
            "biseccion", "x - 1", null, null, 1.0, 3.0, null, null, null, TOL, 200, null);
    ResultadoRaiz r = resolutor.resolver(exacta);
    assertTrue(r.convergio());
    assertEquals(1, r.iteracionesRealizadas());
    assertEquals(1.0, r.raiz(), 0);
    assertTrue(r.mensaje().startsWith("Raíz exacta"));
  }

  @Test
  @DisplayName("Se respeta el máximo de iteraciones")
  void respetaMaximoDeIteraciones() {
    SolicitudRaiz s =
        new SolicitudRaiz(
            "biseccion", "x^2 - 2", null, null, 0.0, 2.0, null, null, null, 1e-15, 7, null);
    ResultadoRaiz r = resolutor.resolver(s);
    assertFalse(r.convergio());
    assertEquals(7, r.iteracionesRealizadas());
    assertTrue(r.mensaje().startsWith("Se alcanzó el máximo de 7 iteraciones"));
  }

  @Test
  @DisplayName("Un método que se escapa termina con mensaje de divergencia")
  void divergencia() {
    // g(x) = x^2 + 1 no tiene punto fijo real: la sucesión se va a infinito.
    SolicitudRaiz s =
        new SolicitudRaiz(
            "punto_fijo", "x^2 - 2", "x^2 + 1", null, null, null, 2.0, null, null, TOL, 200, null);
    ResultadoRaiz r = resolutor.resolver(s);
    assertFalse(r.convergio());
    assertTrue(r.mensaje().startsWith("El método diverge"), r.mensaje());
  }

  @Test
  @DisplayName("La primera iteración de bisección no tiene error y la de Newton sí")
  void primeraIteracion() {
    ResultadoRaiz bis = resolutor.resolver(raiz2("biseccion", null, 0.0, 2.0, null, null, null));
    assertNull(bis.iteraciones().get(0).error());
    assertEquals(1, bis.iteraciones().get(0).n());

    ResultadoRaiz new1 = resolutor.resolver(raiz2("newton", null, null, null, 1.0, null, null));
    // Sin derivada escrita a mano, Newton usa diferencia central: el paso es 0.5
    // salvo el error del método numérico.
    assertEquals(0.5, new1.iteraciones().get(0).error(), 1e-9);
  }

  @Test
  @DisplayName("Bisección guarda a y b como estaban antes de recortar el intervalo")
  void valoresAntesDeRecortar() {
    ResultadoRaiz r = resolutor.resolver(raiz2("biseccion", null, 0.0, 2.0, null, null, null));
    Iteracion primera = r.iteraciones().get(0);
    assertEquals(0.0, primera.valores().get("a"), 0);
    assertEquals(2.0, primera.valores().get("b"), 0);
    assertEquals(1.0, primera.valores().get("xr"), 0);

    Iteracion segunda = r.iteraciones().get(1);
    assertEquals(1.0, segunda.valores().get("a"), 0);
    assertEquals(2.0, segunda.valores().get("b"), 0);
    assertEquals(1.5, segunda.valores().get("xr"), 0);
  }

  @Test
  @DisplayName("El error residual y el relativo también sirven como criterio")
  void otrosTiposDeError() {
    SolicitudRaiz residual =
        new SolicitudRaiz(
            "newton", "x^2 - 2", null, null, null, null, 1.0, null, null, TOL, 200,
            TipoError.RESIDUAL);
    ResultadoRaiz r1 = resolutor.resolver(residual);
    assertTrue(r1.convergio());
    assertTrue(r1.iteraciones().get(0).error() > 0, "el residual existe desde la primera fila");

    SolicitudRaiz relativo =
        new SolicitudRaiz(
            "newton", "x^2 - 2", null, null, null, null, 1.0, null, null, TOL, 200,
            TipoError.RELATIVO);
    ResultadoRaiz r2 = resolutor.resolver(relativo);
    assertTrue(r2.convergio());
    assertEquals(0.5 / 1.5, r2.iteraciones().get(0).error(), 1e-9);
  }

  @Test
  @DisplayName("Faltan datos iniciales o sobra el método: errores claros")
  void validaciones() {
    IllegalArgumentException sinG =
        assertThrows(
            IllegalArgumentException.class,
            () -> resolutor.resolver(raiz2("punto_fijo", null, null, null, 1.0, null, null)));
    assertTrue(sinG.getMessage().contains("g(x)"));

    IllegalArgumentException sinX0 =
        assertThrows(
            IllegalArgumentException.class,
            () -> resolutor.resolver(raiz2("newton", null, null, null, null, null, null)));
    assertTrue(sinX0.getMessage().contains("x0"));

    IllegalArgumentException desconocido =
        assertThrows(
            IllegalArgumentException.class,
            () -> resolutor.resolver(raiz2("bairstow", null, null, null, 1.0, null, null)));
    assertTrue(desconocido.getMessage().startsWith("Método desconocido"));

    SolicitudRaiz tolMala =
        new SolicitudRaiz(
            "newton", "x^2 - 2", null, null, null, null, 1.0, null, null, 0.0, 100, null);
    assertThrows(IllegalArgumentException.class, () -> resolutor.resolver(tolMala));

    SolicitudRaiz demasiadas =
        new SolicitudRaiz(
            "newton", "x^2 - 2", null, null, null, null, 1.0, null, null, TOL, 5000, null);
    assertThrows(IllegalArgumentException.class, () -> resolutor.resolver(demasiadas));
  }

  @Test
  @DisplayName("El catálogo expone los siete métodos en orden")
  void catalogo() {
    CatalogoMetodos c = new CatalogoMetodos();
    assertEquals(
        java.util.List.of(
            "biseccion", "falsa_posicion", "punto_fijo", "newton", "secante", "steffensen",
            "muller"),
        c.listar().stream().map(m -> m.id()).toList());
    assertEquals("Newton-Raphson", c.buscar("newton").nombre());
    assertFalse(c.listar().get(0).columnas().isEmpty());
  }

  @Test
  @DisplayName("Los valores no finitos viajan como null para que el JSON sea válido")
  void noFinitosComoNull() {
    // Con g = ln(x) la sucesión se vuelve negativa y la iteración siguiente ya no
    // es un número real.
    SolicitudRaiz s =
        new SolicitudRaiz(
            "punto_fijo", "x^2 - 2", "ln(x)", null, null, null, 0.5, null, null, TOL, 10, null);
    ResultadoRaiz r = resolutor.resolver(s);
    assertFalse(r.convergio());
    assertNull(r.raiz(), "un NaN tiene que salir como null");
    assertTrue(r.iteraciones().stream().anyMatch(it -> it.fx() == null || it.x() == null));
    assertTrue(r.mensaje().startsWith("El método diverge"), r.mensaje());
  }
}
