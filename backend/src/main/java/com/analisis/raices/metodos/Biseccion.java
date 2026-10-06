package com.analisis.raices.metodos;

import com.analisis.raices.modelo.Columna;
import com.analisis.raices.modelo.SolicitudRaiz;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Bisección: parte el intervalo por la mitad y se queda con la mitad donde f cambia de signo.
 *
 * <p>La falsa posición comparte toda esta mecánica y solo cambia la fórmula de la estimación, así
 * que hereda de aquí y sobrescribe {@link #estimar}.
 */
public class Biseccion extends MetodoRaiz {

  @Override
  public String id() {
    return "biseccion";
  }

  @Override
  public String nombre() {
    return "Bisección";
  }

  @Override
  public String descripcion() {
    return "Parte el intervalo [a, b] por la mitad y conserva el trozo donde f cambia de signo."
        + " Siempre converge si f(a) y f(b) tienen signos distintos, aunque despacio.";
  }

  @Override
  public List<String> requiere() {
    return List.of("a", "b");
  }

  @Override
  public List<Columna> columnas() {
    return List.of(
        new Columna("a", "a"),
        new Columna("b", "b"),
        new Columna("xr", "xr"),
        new Columna("fa", "f(a)"),
        new Columna("fb", "f(b)"),
        new Columna("fxr", "f(xr)"));
  }

  /** Nueva estimación dentro del intervalo. Bisección usa el punto medio. */
  protected double estimar(double a, double b, double fa, double fb) {
    return (a + b) / 2.0;
  }

  @Override
  public void ejecutar(Contexto ctx, SolicitudRaiz solicitud) {
    double a = exigir(solicitud.a(), "a");
    double b = exigir(solicitud.b(), "b");
    if (a > b) {
      double t = a;
      a = b;
      b = t;
    }
    if (a == b) {
      throw new IllegalArgumentException("El intervalo está vacío: a y b son iguales");
    }

    double fa = ctx.f(a);
    double fb = ctx.f(b);
    if (!Double.isFinite(fa) || !Double.isFinite(fb)) {
      throw new IllegalArgumentException(
          "No se puede evaluar f en los extremos del intervalo. Revisa a y b");
    }
    if (fa * fb > 0) {
      throw new IllegalArgumentException(
          "f(a) y f(b) tienen el mismo signo, así que no se garantiza una raíz en [a, b]."
              + " Elige un intervalo donde f cambie de signo");
    }

    // Si alguno de los extremos ya es la raíz, se registra y se termina.
    if (fa == 0.0) {
      ctx.agregar(a, fa, ctx.error(null, a, fa), fila(a, b, a, fa, fb, fa));
      return;
    }
    if (fb == 0.0) {
      ctx.agregar(b, fb, ctx.error(null, b, fb), fila(a, b, b, fa, fb, fb));
      return;
    }

    Double anterior = null;
    for (int k = 0; k < ctx.maxIteraciones(); k++) {
      double xr = estimar(a, b, fa, fb);
      double fxr = ctx.f(xr);
      Double error = ctx.error(anterior, xr, fxr);

      // Se guardan a y b tal como estaban al calcular xr, antes de recortar.
      if (ctx.agregar(xr, fxr, error, fila(a, b, xr, fa, fb, fxr))) {
        return;
      }

      if (fa * fxr < 0) {
        b = xr;
        fb = fxr;
      } else {
        a = xr;
        fa = fxr;
      }
      anterior = xr;
    }
  }

  private static Map<String, Double> fila(
      double a, double b, double xr, double fa, double fb, double fxr) {
    Map<String, Double> v = new LinkedHashMap<>();
    v.put("a", a);
    v.put("b", b);
    v.put("xr", xr);
    v.put("fa", fa);
    v.put("fb", fb);
    v.put("fxr", fxr);
    return v;
  }
}
