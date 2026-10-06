package com.analisis.raices.modelo;

import java.util.List;

/**
 * Resultado de ejecutar un método. Es el JSON que devuelve la API y el mismo que arma el motor del
 * navegador, cambiando solo {@code motor}.
 *
 * @param metodo id del método ejecutado
 * @param nombreMetodo nombre para mostrar
 * @param convergio true si se alcanzó la tolerancia o la raíz exacta
 * @param raiz última estimación ({@code null} si no es finita)
 * @param fRaiz valor de f en esa estimación
 * @param errorFinal error de la última iteración
 * @param iteracionesRealizadas cuántas filas tiene la tabla
 * @param mensaje explicación en español de cómo terminó
 * @param columnas columnas de la tabla de este método
 * @param iteraciones las filas, en orden
 * @param tiempoMs milisegundos que tardó el cálculo
 * @param motor {@code "java"} si lo calculó el servidor, {@code "navegador"} si el cliente
 */
public record ResultadoRaiz(
    String metodo,
    String nombreMetodo,
    boolean convergio,
    Double raiz,
    Double fRaiz,
    Double errorFinal,
    int iteracionesRealizadas,
    String mensaje,
    List<Columna> columnas,
    List<Iteracion> iteraciones,
    long tiempoMs,
    String motor) {

  /** Constructor que marca el resultado como calculado por el motor Java. */
  public ResultadoRaiz(
      String metodo,
      String nombreMetodo,
      boolean convergio,
      Double raiz,
      Double fRaiz,
      Double errorFinal,
      int iteracionesRealizadas,
      String mensaje,
      List<Columna> columnas,
      List<Iteracion> iteraciones,
      long tiempoMs) {
    this(
        metodo,
        nombreMetodo,
        convergio,
        raiz,
        fRaiz,
        errorFinal,
        iteracionesRealizadas,
        mensaje,
        columnas,
        iteraciones,
        tiempoMs,
        "java");
  }
}
