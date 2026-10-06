package com.analisis.raices.expresion;

/**
 * Error de sintaxis en la expresión escrita por la persona.
 *
 * <p>Hereda de {@link IllegalArgumentException} para que el manejador de
 * errores de la API lo traduzca directamente a un 400 con el mensaje tal cual.
 */
public class ErrorExpresion extends IllegalArgumentException {

  private static final long serialVersionUID = 1L;

  public ErrorExpresion(String mensaje) {
    super(mensaje);
  }
}
