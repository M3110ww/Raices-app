package com.analisis.raices.metodos;

import com.analisis.raices.modelo.Columna;
import com.analisis.raices.modelo.SolicitudRaiz;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Secante: como Newton, pero sustituye la tangente por la recta que pasa por los dos últimos
 * puntos, así que no hace falta derivada.
 */
public class Secante extends MetodoRaiz {

  @Override
  public String id() {
    return "secante";
  }

  @Override
  public String nombre() {
    return "Secante";
  }

  @Override
  public String descripcion() {
    return "Reemplaza la tangente de Newton por la recta que une los dos últimos puntos,"
        + " así que no necesita la derivada. Casi tan rápido como Newton.";
  }

  @Override
  public List<String> requiere() {
    return List.of("x0", "x1");
  }

  @Override
  public List<Columna> columnas() {
    return List.of(
        new Columna("xim1", "xi−1"),
        new Columna("xi", "xi"),
        new Columna("fxim1", "f(xi−1)"),
        new Columna("fxi", "f(xi)"),
        new Columna("xi1", "xi+1"));
  }

  @Override
  public void ejecutar(Contexto ctx, SolicitudRaiz solicitud) {
    double xim1 = exigir(solicitud.x0(), "x0");
    double xi = exigir(solicitud.x1(), "x1");
    double fxim1 = ctx.f(xim1);
    double fxi = ctx.f(xi);

    for (int k = 0; k < ctx.maxIteraciones(); k++) {
      double denominador = fxi - fxim1;
      if (denominador == 0.0 || !Double.isFinite(denominador)) {
        ctx.fallar(
            "En la iteración "
                + (k + 1)
                + " los dos puntos dan el mismo valor de f: la secante queda horizontal."
                + " Prueba con otros x0 y x1.");
        return;
      }

      double xi1 = xi - fxi * (xi - xim1) / denominador;
      double fxi1 = ctx.f(xi1);
      Double error = ctx.error(xi, xi1, fxi1);

      Map<String, Double> v = new LinkedHashMap<>();
      v.put("xim1", xim1);
      v.put("xi", xi);
      v.put("fxim1", fxim1);
      v.put("fxi", fxi);
      v.put("xi1", xi1);

      if (ctx.agregar(xi1, fxi1, error, v)) {
        return;
      }

      xim1 = xi;
      fxim1 = fxi;
      xi = xi1;
      fxi = fxi1;
    }
  }
}
