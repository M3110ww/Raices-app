package com.analisis.raices.metodos;

/**
 * Falsa posición (regula falsi): igual que bisección, pero en vez del punto medio toma el corte con
 * el eje de la cuerda que une (a, f(a)) con (b, f(b)).
 */
public class FalsaPosicion extends Biseccion {

  @Override
  public String id() {
    return "falsa_posicion";
  }

  @Override
  public String nombre() {
    return "Falsa posición";
  }

  @Override
  public String descripcion() {
    return "Traza la cuerda entre (a, f(a)) y (b, f(b)) y toma su corte con el eje x."
        + " Aprovecha la pendiente de f, así que suele llegar antes que bisección.";
  }

  @Override
  protected double estimar(double a, double b, double fa, double fb) {
    return b - fb * (a - b) / (fa - fb);
  }
}
