package com.analisis.raices.modelo;

import java.util.List;

/**
 * Descripción de un método, tal como la expone {@code GET /api/metodos}.
 *
 * @param id identificador usado en las peticiones (por ejemplo {@code "newton"})
 * @param nombre nombre para mostrar
 * @param descripcion explicación corta de cómo trabaja
 * @param requiere datos iniciales que el método necesita ({@code a}, {@code b}, {@code x0},
 *     {@code x1}, {@code x2}, {@code g})
 * @param columnas columnas de su tabla de iteraciones
 */
public record InfoMetodo(
    String id, String nombre, String descripcion, List<String> requiere, List<Columna> columnas) {}
