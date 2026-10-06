package com.analisis.raices.modelo;

/** Forma de medir el error con que se decide si el método ya convergió. */
public enum TipoError {

  /** |xi − xi−1| */
  ABSOLUTO("Error absoluto |xi − xi−1|"),

  /** |xi − xi−1| / |xi| */
  RELATIVO("Error relativo |xi − xi−1| / |xi|"),

  /** |f(xi)| */
  RESIDUAL("Residual |f(xi)|");

  private final String etiqueta;

  TipoError(String etiqueta) {
    this.etiqueta = etiqueta;
  }

  public String etiqueta() {
    return etiqueta;
  }
}
