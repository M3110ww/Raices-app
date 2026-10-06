package com.analisis.raices.metodos;

import com.analisis.raices.modelo.Columna;
import com.analisis.raices.modelo.SolicitudRaiz;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Newton-Raphson: sigue la tangente de f en x_i hasta el eje x.
 *
 * <p>x_{i+1} = x_i − f(x_i)/f′(x_i). Es el más rápido de los siete (converge de forma cuadrática)
 * pero se atasca si la derivada se anula.
 */
public class Newton extends MetodoRaiz {

  @Override
  public String id() {
    return "newton";
  }

  @Override
  public String nombre() {
    return "Newton-Raphson";
  }

  @Override
  public String descripcion() {
    return "Sigue la tangente de f en x_i hasta cortar el eje x:"
        + " x_{i+1} = x_i − f(x_i)/f′(x_i). Muy rápido, pero necesita que f′ no se anule.";
  }

  @Override
  public List<String> requiere() {
    return List.of("x0");
  }

  @Override
  public List<Columna> columnas() {
    return List.of(
        new Columna("xi", "xi"),
        new Columna("fxi", "f(xi)"),
        new Columna("dfxi", "f′(xi)"),
        new Columna("xi1", "xi+1"));
  }

  @Override
  public void ejecutar(Contexto ctx, SolicitudRaiz solicitud) {
    double x = exigir(solicitud.x0(), "x0");

    for (int k = 0; k < ctx.maxIteraciones(); k++) {
      double xi = x;
      double fxi = ctx.f(xi);
      double dfxi = ctx.df(xi);

      if (dfxi == 0.0 || !Double.isFinite(dfxi)) {
        ctx.fallar(
            "La derivada se anuló en la iteración "
                + (k + 1)
                + ", así que la tangente no corta el eje. Prueba con otro x0.");
        return;
      }

      double xi1 = xi - fxi / dfxi;
      double fxi1 = ctx.f(xi1);
      Double error = ctx.error(xi, xi1, fxi1);

      Map<String, Double> v = new LinkedHashMap<>();
      v.put("xi", xi);
      v.put("fxi", fxi);
      v.put("dfxi", dfxi);
      v.put("xi1", xi1);

      if (ctx.agregar(xi1, fxi1, error, v)) {
        return;
      }
      x = xi1;
    }
  }
}
