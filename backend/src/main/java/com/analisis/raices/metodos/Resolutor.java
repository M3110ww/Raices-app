package com.analisis.raices.metodos;

import com.analisis.raices.expresion.Expresion;
import com.analisis.raices.expresion.Nodo;
import com.analisis.raices.modelo.Numeros;
import com.analisis.raices.modelo.ResultadoRaiz;
import com.analisis.raices.modelo.SolicitudRaiz;
import com.analisis.raices.modelo.TipoError;

/**
 * Orquesta una ejecución completa: rellena los valores por omisión, compila las expresiones,
 * comprueba que estén los datos iniciales, corre el método y arma el resultado.
 */
public final class Resolutor {

  /** Tolerancia por omisión. */
  public static final double TOLERANCIA_POR_OMISION = 1e-6;

  /** Máximo de iteraciones por omisión. */
  public static final int MAX_ITERACIONES_POR_OMISION = 100;

  /** Tope absoluto de iteraciones que se acepta en una petición. */
  public static final int TOPE_ITERACIONES = 1000;

  private final CatalogoMetodos catalogo;

  public Resolutor(CatalogoMetodos catalogo) {
    this.catalogo = catalogo;
  }

  public ResultadoRaiz resolver(SolicitudRaiz solicitud) {
    long inicio = System.nanoTime();

    MetodoRaiz metodo = catalogo.buscar(solicitud.metodo());

    double tolerancia =
        solicitud.tolerancia() == null ? TOLERANCIA_POR_OMISION : solicitud.tolerancia();
    if (!(tolerancia > 0) || !Double.isFinite(tolerancia)) {
      throw new IllegalArgumentException("La tolerancia tiene que ser un número mayor que cero");
    }

    int maxIteraciones =
        solicitud.maxIteraciones() == null
            ? MAX_ITERACIONES_POR_OMISION
            : solicitud.maxIteraciones();
    if (maxIteraciones < 1 || maxIteraciones > TOPE_ITERACIONES) {
      throw new IllegalArgumentException(
          "El máximo de iteraciones tiene que estar entre 1 y " + TOPE_ITERACIONES);
    }

    TipoError tipoError = solicitud.tipoError() == null ? TipoError.ABSOLUTO : solicitud.tipoError();

    comprobarDatosIniciales(metodo, solicitud);

    Nodo f = Expresion.compilar(solicitud.funcion());
    Nodo g = tiene(solicitud.g()) ? Expresion.compilar(solicitud.g()) : null;
    Nodo df = tiene(solicitud.derivada()) ? Expresion.compilar(solicitud.derivada()) : null;

    Contexto ctx = new Contexto(f, g, df, tolerancia, maxIteraciones, tipoError);
    metodo.ejecutar(ctx, solicitud);
    ctx.agotado();

    long tiempoMs = Math.round((System.nanoTime() - inicio) / 1_000_000.0);

    return new ResultadoRaiz(
        metodo.id(),
        metodo.nombre(),
        ctx.convergio(),
        Numeros.json(ctx.raiz()),
        Numeros.json(ctx.fRaiz()),
        Numeros.json(ctx.errorFinal()),
        ctx.iteraciones().size(),
        ctx.mensaje(),
        metodo.columnas(),
        ctx.iteraciones(),
        tiempoMs);
  }

  /** Verifica que lleguen los valores iniciales que el método declara en {@code requiere()}. */
  private static void comprobarDatosIniciales(MetodoRaiz metodo, SolicitudRaiz s) {
    for (String dato : metodo.requiere()) {
      boolean falta =
          switch (dato) {
            case "a" -> s.a() == null;
            case "b" -> s.b() == null;
            case "x0" -> s.x0() == null;
            case "x1" -> s.x1() == null;
            case "x2" -> s.x2() == null;
            case "g" -> !tiene(s.g());
            default -> false;
          };
      if (falta) {
        throw new IllegalArgumentException(
            "El método "
                + metodo.nombre()
                + " necesita "
                + ("g".equals(dato) ? "la función g(x)" : "el valor inicial " + dato));
      }
    }
  }

  private static boolean tiene(String texto) {
    return texto != null && !texto.isBlank();
  }
}
