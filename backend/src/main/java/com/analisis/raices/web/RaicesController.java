package com.analisis.raices.web;

import com.analisis.raices.metodos.CatalogoMetodos;
import com.analisis.raices.metodos.Resolutor;
import com.analisis.raices.modelo.InfoMetodo;
import com.analisis.raices.modelo.ResultadoRaiz;
import com.analisis.raices.modelo.SolicitudRaiz;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Los tres endpoints de la API. */
@RestController
@RequestMapping("/api")
public class RaicesController {

  private final CatalogoMetodos catalogo;
  private final Resolutor resolutor;

  public RaicesController(CatalogoMetodos catalogo, Resolutor resolutor) {
    this.catalogo = catalogo;
    this.resolutor = resolutor;
  }

  /** Sirve para que el frontend sepa si el servidor está despierto. */
  @GetMapping("/salud")
  public Map<String, String> salud() {
    Map<String, String> respuesta = new LinkedHashMap<>();
    respuesta.put("estado", "ok");
    respuesta.put("motor", "java");
    return respuesta;
  }

  /** Catálogo de métodos con lo que necesita cada uno y sus columnas. */
  @GetMapping("/metodos")
  public List<InfoMetodo> metodos() {
    return catalogo.listar();
  }

  /** Resuelve f(x) = 0 con el método indicado. */
  @PostMapping("/raices/resolver")
  public ResultadoRaiz resolver(@Valid @RequestBody SolicitudRaiz solicitud) {
    return resolutor.resolver(solicitud);
  }
}
