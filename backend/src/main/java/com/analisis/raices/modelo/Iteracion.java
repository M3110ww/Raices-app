package com.analisis.raices.modelo;

import java.util.Map;

/**
 * Una fila de la tabla de iteraciones.
 *
 * <p>Los campos numéricos son {@code Double} y no {@code double} porque NaN e Infinito no son JSON
 * válido: cuando aparecen se envían como {@code null}.
 *
 * @param n número de iteración, empezando en 1
 * @param x estimación de la raíz en esta iteración
 * @param fx valor de f en esa estimación
 * @param error error medido según el {@link TipoError} elegido ({@code null} en la primera
 *     iteración de los métodos que todavía no tienen con qué comparar)
 * @param valores valores intermedios propios del método, por clave
 */
public record Iteracion(int n, Double x, Double fx, Double error, Map<String, Double> valores) {}
