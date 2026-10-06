package com.analisis.raices.modelo;

/** Utilidades para que ningún NaN ni Infinito se cuele en el JSON. */
public final class Numeros {

  private Numeros() {}

  /** Devuelve el valor, o {@code null} si no es un número finito. */
  public static Double json(double v) {
    return Double.isFinite(v) ? Double.valueOf(v) : null;
  }

  /** Igual que {@link #json(double)} pero admitiendo que ya venga nulo. */
  public static Double json(Double v) {
    return (v != null && Double.isFinite(v)) ? v : null;
  }
}
