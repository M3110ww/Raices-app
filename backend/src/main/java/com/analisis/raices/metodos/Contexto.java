package com.analisis.raices.metodos;

import com.analisis.raices.expresion.Nodo;
import com.analisis.raices.modelo.Iteracion;
import com.analisis.raices.modelo.Numeros;
import com.analisis.raices.modelo.TipoError;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Pizarra de trabajo que comparten todos los métodos.
 *
 * <p>Guarda las funciones ya compiladas, el criterio de parada y la lista de iteraciones. Los
 * métodos solo calculan la siguiente estimación y llaman a {@link #agregar}: toda la lógica de
 * cuándo parar (tolerancia alcanzada, raíz exacta, divergencia) vive aquí, así que los siete
 * métodos se comportan igual y los mensajes son consistentes.
 *
 * <p>No tiene ninguna anotación de Spring a propósito: así el motor se puede probar aislado.
 */
public final class Contexto {

  /** Más allá de esta magnitud se considera que el método se escapó. */
  private static final double LIMITE_DIVERGENCIA = 1e15;

  private final Nodo f;
  private final Nodo g;
  private final Nodo df;
  private final double tolerancia;
  private final int maxIteraciones;
  private final TipoError tipoError;

  private final List<Iteracion> iteraciones = new ArrayList<>();
  private boolean convergio;
  private String mensaje = "";
  private double raiz = Double.NaN;
  private double fRaiz = Double.NaN;
  private Double errorFinal;

  public Contexto(
      Nodo f, Nodo g, Nodo df, double tolerancia, int maxIteraciones, TipoError tipoError) {
    this.f = f;
    this.g = g;
    this.df = df;
    this.tolerancia = tolerancia;
    this.maxIteraciones = maxIteraciones;
    this.tipoError = tipoError;
  }

  // ------------------------------------------------------------- funciones

  /** Evalúa f(x). */
  public double f(double x) {
    return f.eval(x);
  }

  /** Evalúa g(x), la función de iteración del punto fijo. */
  public double g(double x) {
    if (g == null) {
      throw new IllegalArgumentException("Este método necesita la función g(x)");
    }
    return g.eval(x);
  }

  /**
   * Evalúa f′(x).
   *
   * <p>Si no se recibió la derivada, se aproxima con diferencia central y un paso proporcional a la
   * magnitud de x, para no perder precisión cuando x es grande.
   */
  public double df(double x) {
    if (df != null) {
      return df.eval(x);
    }
    double h = 1e-6 * Math.max(1.0, Math.abs(x));
    return (f.eval(x + h) - f.eval(x - h)) / (2 * h);
  }

  public double tolerancia() {
    return tolerancia;
  }

  public int maxIteraciones() {
    return maxIteraciones;
  }

  public TipoError tipoError() {
    return tipoError;
  }

  // ----------------------------------------------------------------- error

  /**
   * Calcula el error de la nueva estimación según el tipo elegido.
   *
   * <p>El residual se puede calcular siempre; el absoluto y el relativo necesitan una estimación
   * anterior, así que devuelven {@code null} en la primera iteración de los métodos que arrancan
   * sin historia (bisección, por ejemplo).
   *
   * @param anterior estimación previa, o {@code null} si todavía no hay
   * @param nuevo estimación actual
   * @param fNuevo valor de f en la estimación actual
   */
  public Double error(Double anterior, double nuevo, double fNuevo) {
    if (tipoError == TipoError.RESIDUAL) {
      return Math.abs(fNuevo);
    }
    if (anterior == null) {
      return null;
    }
    double diferencia = Math.abs(nuevo - anterior);
    if (tipoError == TipoError.ABSOLUTO) {
      return diferencia;
    }
    // Si la nueva estimación es exactamente 0 no se puede dividir: se usa la
    // diferencia absoluta para no devolver infinito.
    return nuevo == 0.0 ? diferencia : diferencia / Math.abs(nuevo);
  }

  // ------------------------------------------------------------ iteraciones

  /**
   * Registra una iteración y decide si hay que detenerse.
   *
   * @return true si el método debe terminar (por éxito o por divergencia)
   */
  public boolean agregar(double x, double fx, Double error, Map<String, Double> valores) {
    int n = iteraciones.size() + 1;

    Map<String, Double> limpios = new LinkedHashMap<>();
    valores.forEach((clave, valor) -> limpios.put(clave, Numeros.json(valor)));

    iteraciones.add(
        new Iteracion(
            n,
            Numeros.json(x),
            Numeros.json(fx),
            Numeros.json(error),
            Collections.unmodifiableMap(limpios)));

    raiz = x;
    fRaiz = fx;
    errorFinal = error;

    if (!Double.isFinite(x) || !Double.isFinite(fx)) {
      return terminar(
          false,
          "El método diverge: en la iteración "
              + n
              + " apareció un valor que no es un número. Prueba con otro valor inicial.");
    }
    if (fx == 0.0) {
      return terminar(true, "Raíz exacta: f(x) = 0 en la iteración " + n + ".");
    }
    if (error != null && error <= tolerancia) {
      return terminar(
          true,
          "Convergió en "
              + n
              + (n == 1 ? " iteración" : " iteraciones")
              + ": el error "
              + formatear(error)
              + " es menor o igual que la tolerancia "
              + formatear(tolerancia)
              + ".");
    }
    if (Math.abs(x) > LIMITE_DIVERGENCIA) {
      return terminar(
          false,
          "El método diverge: en la iteración "
              + n
              + " la estimación superó 1e15. Prueba con otro valor inicial.");
    }
    return false;
  }

  private boolean terminar(boolean exito, String texto) {
    this.convergio = exito;
    this.mensaje = texto;
    return true;
  }

  /** Marca un final sin éxito con un motivo propio del método. */
  public void fallar(String texto) {
    terminar(false, texto);
  }

  /**
   * Mensaje para cuando el bucle acaba sin haber alcanzado la tolerancia.
   *
   * <p>Lo llama el resolutor, no los métodos.
   */
  void agotado() {
    if (!mensaje.isEmpty()) {
      return;
    }
    terminar(
        false,
        "Se alcanzó el máximo de "
            + maxIteraciones
            + (maxIteraciones == 1 ? " iteración" : " iteraciones")
            + " sin bajar de la tolerancia "
            + formatear(tolerancia)
            + ". Sube el máximo o afloja la tolerancia.");
  }

  /**
   * Da formato científico con tres decimales.
   *
   * <p>Java rellena el exponente con ceros ({@code 1.000e-06}) y JavaScript no, así que aquí se
   * quitan: los mensajes de los dos motores tienen que salir idénticos.
   */
  static String formatear(double v) {
    String s = String.format(Locale.ROOT, "%.3e", v);
    return s.replaceAll("e([+-])0+(\\d)", "e$1$2");
  }

  // ---------------------------------------------------------------- lectura

  public List<Iteracion> iteraciones() {
    return Collections.unmodifiableList(iteraciones);
  }

  public boolean convergio() {
    return convergio;
  }

  public String mensaje() {
    return mensaje;
  }

  public double raiz() {
    return raiz;
  }

  public double fRaiz() {
    return fRaiz;
  }

  public Double errorFinal() {
    return errorFinal;
  }

  public boolean termino() {
    return !mensaje.isEmpty();
  }
}
