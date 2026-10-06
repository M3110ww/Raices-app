package com.analisis.raices.web;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Traduce las excepciones a respuestas con forma {@code {"error": "..."}}.
 *
 * <p>Todo lo que es culpa de la petición (expresión mal escrita, intervalo sin cambio de signo,
 * datos iniciales que faltan) sale como 400 con el mensaje en español tal cual, para que la
 * interfaz pueda mostrarlo sin traducir nada.
 */
@RestControllerAdvice
public class ManejadorErrores {

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> peticionInvalida(IllegalArgumentException e) {
    return cuerpo(HttpStatus.BAD_REQUEST, e.getMessage());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> validacion(MethodArgumentNotValidException e) {
    String mensaje =
        e.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getDefaultMessage())
            .findFirst()
            .orElse("La petición no es válida");
    return cuerpo(HttpStatus.BAD_REQUEST, mensaje);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<Map<String, String>> jsonIlegible(HttpMessageNotReadableException e) {
    return cuerpo(HttpStatus.BAD_REQUEST, "El cuerpo de la petición no es un JSON válido");
  }

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<Map<String, String>> errorInesperado(RuntimeException e) {
    return cuerpo(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Error inesperado al calcular: " + (e.getMessage() == null ? e.toString() : e.getMessage()));
  }

  private static ResponseEntity<Map<String, String>> cuerpo(HttpStatus estado, String mensaje) {
    Map<String, String> respuesta = new LinkedHashMap<>();
    respuesta.put("error", mensaje == null ? "Error desconocido" : mensaje);
    return ResponseEntity.status(estado).body(respuesta);
  }
}
