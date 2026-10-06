package com.analisis.raices.metodos;

import com.analisis.raices.modelo.Columna;
import com.analisis.raices.modelo.SolicitudRaiz;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Müller: hace pasar una parábola por los tres últimos puntos y toma su corte con el eje x.
 *
 * <p>La parábola es p(x) = pa·(x − x2)² + pb·(x − x2) + pc. Los coeficientes se devuelven en los
 * valores de cada iteración (sin ser columnas visibles) para poder dibujarla.
 */
public class Muller extends MetodoRaiz {

  @Override
  public String id() {
    return "muller";
  }

  @Override
  public String nombre() {
    return "Müller";
  }

  @Override
  public String descripcion() {
    return "Pasa una parábola por los tres últimos puntos y usa su corte con el eje x."
        + " Al curvarse se acerca más rápido que la secante.";
  }

  @Override
  public List<String> requiere() {
    return List.of("x0", "x1", "x2");
  }

  @Override
  public List<Columna> columnas() {
    return List.of(
        new Columna("x0", "x0"),
        new Columna("x1", "x1"),
        new Columna("x2", "x2"),
        new Columna("x3", "x3"));
  }

  @Override
  public void ejecutar(Contexto ctx, SolicitudRaiz solicitud) {
    double x0 = exigir(solicitud.x0(), "x0");
    double x1 = exigir(solicitud.x1(), "x1");
    double x2 = exigir(solicitud.x2(), "x2");

    for (int k = 0; k < ctx.maxIteraciones(); k++) {
      double f0 = ctx.f(x0);
      double f1 = ctx.f(x1);
      double f2 = ctx.f(x2);

      double h0 = x1 - x0;
      double h1 = x2 - x1;
      if (h0 == 0.0 || h1 == 0.0) {
        ctx.fallar(
            "Los tres puntos iniciales deben ser distintos para poder trazar la parábola.");
        return;
      }

      double d0 = (f1 - f0) / h0;
      double d1 = (f2 - f1) / h1;
      double pa = (d1 - d0) / (h1 + h0);
      double pb = pa * h1 + d1;
      double pc = f2;

      double discriminante = pb * pb - 4 * pa * pc;
      if (discriminante < 0) {
        ctx.fallar(
            "En la iteración "
                + (k + 1)
                + " la parábola no corta el eje x: la raíz es compleja."
                + " Prueba con otros puntos iniciales.");
        return;
      }

      double r = Math.sqrt(discriminante);
      // Se elige el denominador de mayor magnitud para no perder cifras.
      double denominador = Math.abs(pb + r) > Math.abs(pb - r) ? pb + r : pb - r;
      if (denominador == 0.0) {
        ctx.fallar(
            "En la iteración " + (k + 1) + " la parábola queda plana. Prueba con otros puntos.");
        return;
      }

      double x3 = x2 - 2 * pc / denominador;
      double f3 = ctx.f(x3);
      Double error = ctx.error(x2, x3, f3);

      Map<String, Double> v = new LinkedHashMap<>();
      v.put("x0", x0);
      v.put("x1", x1);
      v.put("x2", x2);
      v.put("x3", x3);
      v.put("pa", pa);
      v.put("pb", pb);
      v.put("pc", pc);

      if (ctx.agregar(x3, f3, error, v)) {
        return;
      }

      x0 = x1;
      x1 = x2;
      x2 = x3;
    }
  }
}
