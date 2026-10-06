package com.analisis.raices.metodos;

import com.analisis.raices.modelo.Columna;
import com.analisis.raices.modelo.SolicitudRaiz;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Punto fijo: se reescribe f(x) = 0 como x = g(x) y se itera x_{i+1} = g(x_i).
 *
 * <p>Converge solo si |g′(x)| &lt; 1 cerca de la raíz, por eso la elección de g importa tanto.
 */
public class PuntoFijo extends MetodoRaiz {

  @Override
  public String id() {
    return "punto_fijo";
  }

  @Override
  public String nombre() {
    return "Punto fijo";
  }

  @Override
  public String descripcion() {
    return "Reescribe la ecuación como x = g(x) y repite x_{i+1} = g(x_i)."
        + " Converge si |g′(x)| < 1 alrededor de la raíz.";
  }

  @Override
  public List<String> requiere() {
    return List.of("x0", "g");
  }

  @Override
  public List<Columna> columnas() {
    return List.of(
        new Columna("xi", "xi"),
        new Columna("gxi", "g(xi)"),
        new Columna("fxi1", "f(xi+1)"));
  }

  @Override
  public void ejecutar(Contexto ctx, SolicitudRaiz solicitud) {
    double x = exigir(solicitud.x0(), "x0");

    for (int k = 0; k < ctx.maxIteraciones(); k++) {
      double xi = x;
      double gxi = ctx.g(xi);
      double fxi1 = ctx.f(gxi);
      Double error = ctx.error(xi, gxi, fxi1);

      Map<String, Double> v = new LinkedHashMap<>();
      v.put("xi", xi);
      v.put("gxi", gxi);
      v.put("fxi1", fxi1);

      if (ctx.agregar(gxi, fxi1, error, v)) {
        return;
      }
      x = gxi;
    }
  }
}
