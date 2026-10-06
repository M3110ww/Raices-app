package com.analisis.raices.expresion;

/**
 * Nodo del árbol de la expresión ya compilada.
 *
 * <p>El parser no construye objetos con etiquetas de tipo: cada nodo es una
 * lambda que sabe calcularse sola, así que evaluar la expresión es una simple
 * cadena de llamadas sin ningún {@code switch} en tiempo de ejecución.
 */
@FunctionalInterface
public interface Nodo {

  /** Evalúa la expresión para el valor dado de la variable x. */
  double eval(double x);
}
