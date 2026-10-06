package com.analisis.raices.metodos;

import com.analisis.raices.modelo.Columna;
import com.analisis.raices.modelo.SolicitudRaiz;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Steffensen: acelera el punto fijo usando un solo valor inicial y sin derivada.
 *
 * <p>Con z = x + f(x), la siguiente estimación es x − f(x)²/(f(z) − f(x)). Alcanza velocidad
 * cuadrática como Newton, pero solo con evaluaciones de f.
 */
public class Steffensen extends MetodoRaiz {

  @Override
  public String id() {
    return "steffensen";
  }

  @Override
  public String nombre() {
    return "Steffensen";
  }

  @Override
  public String descripcion() {
    return "Con z = x + f(x), avanza a x − f(x)²/(f(z) − f(x))."
        + " Llega a la velocidad de Newton sin necesitar la derivada.";
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
        new Columna("z", "z = xi + f(xi)"),
        new Columna("fxifx", "f(z)"),
        new Columna("xi1", "xi+1"));
  }

  @Override
  public void ejecutar(Contexto ctx, SolicitudRaiz solicitud) {
    double x = exigir(solicitud.x0(), "x0");

    for (int k = 0; k < ctx.maxIteraciones(); k++) {
      double xi = x;
      double fxi = ctx.f(xi);
      double z = xi + fxi;
      double fz = ctx.f(z);
      double denominador = fz - fxi;

      if (denominador == 0.0 || !Double.isFinite(denominador)) {
        ctx.fallar(
            "En la iteración "
                + (k + 1)
                + " se anuló el denominador f(z) − f(x). Prueba con otro x0.");
        return;
      }

      double xi1 = xi - (fxi * fxi) / denominador;
      double fxi1 = ctx.f(xi1);
      Double error = ctx.error(xi, xi1, fxi1);

      Map<String, Double> v = new LinkedHashMap<>();
      v.put("xi", xi);
      v.put("fxi", fxi);
      v.put("z", z);
      v.put("fxifx", fz);
      v.put("xi1", xi1);

      if (ctx.agregar(xi1, fxi1, error, v)) {
        return;
      }
      x = xi1;
    }
  }
}
