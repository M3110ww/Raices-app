package com.analisis.raices.metodos;

import com.analisis.raices.modelo.Columna;
import com.analisis.raices.modelo.InfoMetodo;
import com.analisis.raices.modelo.SolicitudRaiz;
import java.util.List;

/**
 * Contrato que cumple cada método numérico.
 *
 * <p>Una implementación solo se encarga de ir produciendo estimaciones y de llamar a {@link
 * Contexto#agregar}; el contexto decide cuándo parar.
 */
public abstract class MetodoRaiz {

  /** Identificador que se usa en la API. */
  public abstract String id();

  /** Nombre para mostrar. */
  public abstract String nombre();

  /** Explicación corta de cómo trabaja el método. */
  public abstract String descripcion();

  /**
   * Datos iniciales que necesita: {@code "a"}, {@code "b"}, {@code "x0"}, {@code "x1"}, {@code
   * "x2"} o {@code "g"}.
   */
  public abstract List<String> requiere();

  /** Columnas de su tabla de iteraciones. */
  public abstract List<Columna> columnas();

  /** Ejecuta el método, registrando cada paso en el contexto. */
  public abstract void ejecutar(Contexto ctx, SolicitudRaiz solicitud);

  /** Ficha del método para {@code GET /api/metodos}. */
  public final InfoMetodo info() {
    return new InfoMetodo(id(), nombre(), descripcion(), requiere(), columnas());
  }

  /** Lee un valor inicial que ya debería estar validado. */
  protected static double exigir(Double valor, String nombre) {
    if (valor == null) {
      throw new IllegalArgumentException("Falta el valor inicial " + nombre);
    }
    return valor;
  }
}
