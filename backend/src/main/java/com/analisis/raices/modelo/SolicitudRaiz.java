package com.analisis.raices.modelo;

import jakarta.validation.constraints.NotBlank;

/**
 * Petición para resolver f(x) = 0.
 *
 * <p>Los valores iniciales son opcionales en el tipo porque cada método pide los suyos; el
 * resolutor comprueba que estén los que hacen falta.
 *
 * @param metodo id del método ({@code biseccion}, {@code newton}, ...)
 * @param funcion expresión de f(x)
 * @param g expresión de g(x), solo para punto fijo
 * @param derivada expresión de f′(x); si falta, Newton usa derivada numérica
 * @param a extremo izquierdo del intervalo
 * @param b extremo derecho del intervalo
 * @param x0 primera aproximación
 * @param x1 segunda aproximación
 * @param x2 tercera aproximación
 * @param tolerancia criterio de parada (por omisión 1e-6)
 * @param maxIteraciones tope de iteraciones (por omisión 100, entre 1 y 1000)
 * @param tipoError cómo medir el error (por omisión {@link TipoError#ABSOLUTO})
 */
public record SolicitudRaiz(
    @NotBlank(message = "Indica el método a usar") String metodo,
    @NotBlank(message = "Escribe la función f(x)") String funcion,
    String g,
    String derivada,
    Double a,
    Double b,
    Double x0,
    Double x1,
    Double x2,
    Double tolerancia,
    Integer maxIteraciones,
    TipoError tipoError) {}
