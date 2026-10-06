package com.analisis.raices.web;

import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** Pruebas de los endpoints con MockMvc. */
@SpringBootTest
@AutoConfigureMockMvc
class RaicesControllerTest {

  @Autowired private MockMvc mvc;

  @Test
  @DisplayName("GET /api/salud responde ok")
  void salud() throws Exception {
    mvc.perform(get("/api/salud"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado", is("ok")))
        .andExpect(jsonPath("$.motor", is("java")));
  }

  @Test
  @DisplayName("GET /api/metodos devuelve los siete métodos con sus requisitos")
  void metodos() throws Exception {
    mvc.perform(get("/api/metodos"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(7)))
        .andExpect(jsonPath("$[0].id", is("biseccion")))
        .andExpect(jsonPath("$[0].requiere", is(java.util.List.of("a", "b"))))
        .andExpect(jsonPath("$[3].id", is("newton")))
        .andExpect(jsonPath("$[3].columnas[0].clave", is("xi")))
        .andExpect(jsonPath("$[6].id", is("muller")));
  }

  @Test
  @DisplayName("POST resolver con Newton encuentra la raíz de x^3 - x - 2")
  void resolverNewton() throws Exception {
    String cuerpo =
        """
        {"metodo":"newton","funcion":"x^3 - x - 2","x0":1,"tolerancia":1e-6}
        """;
    mvc.perform(post("/api/raices/resolver").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.convergio", is(true)))
        .andExpect(jsonPath("$.metodo", is("newton")))
        .andExpect(jsonPath("$.motor", is("java")))
        .andExpect(jsonPath("$.raiz", closeTo(1.521380, 1e-5)))
        .andExpect(jsonPath("$.iteraciones[0].n", is(1)));
  }

  @Test
  @DisplayName("POST resolver con bisección usa los valores por omisión")
  void resolverBiseccionPorOmision() throws Exception {
    String cuerpo = """
        {"metodo":"biseccion","funcion":"cos(x) - x","a":0,"b":1}
        """;
    mvc.perform(post("/api/raices/resolver").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.convergio", is(true)))
        .andExpect(jsonPath("$.raiz", closeTo(0.7390851, 1e-5)))
        .andExpect(jsonPath("$.columnas", hasSize(6)));
  }

  @Test
  @DisplayName("Una expresión mal escrita devuelve 400 con el mensaje en español")
  void expresionInvalida() throws Exception {
    String cuerpo = """
        {"metodo":"newton","funcion":"x^2 + y","x0":1}
        """;
    mvc.perform(post("/api/raices/resolver").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error", containsString("Usa x como variable")));
  }

  @Test
  @DisplayName("Un intervalo sin cambio de signo devuelve 400")
  void intervaloInvalido() throws Exception {
    String cuerpo = """
        {"metodo":"biseccion","funcion":"x^2 - 2","a":2,"b":3}
        """;
    mvc.perform(post("/api/raices/resolver").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error", containsString("mismo signo")));
  }

  @Test
  @DisplayName("Si falta la función, la validación responde 400")
  void faltaLaFuncion() throws Exception {
    String cuerpo = """
        {"metodo":"newton","x0":1}
        """;
    mvc.perform(post("/api/raices/resolver").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error", is("Escribe la función f(x)")));
  }

  @Test
  @DisplayName("Un JSON ilegible responde 400")
  void jsonIlegible() throws Exception {
    mvc.perform(
            post("/api/raices/resolver")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{esto no es json"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error", containsString("JSON")));
  }

  @Test
  @DisplayName("Los valores no finitos salen como null y el JSON sigue siendo válido")
  void noFinitosComoNull() throws Exception {
    String cuerpo =
        """
        {"metodo":"punto_fijo","funcion":"x^2 - 2","g":"ln(x)","x0":0.5,"maxIteraciones":10}
        """;
    mvc.perform(post("/api/raices/resolver").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.convergio", is(false)))
        .andExpect(jsonPath("$.raiz").isEmpty())
        .andExpect(jsonPath("$.mensaje", containsString("diverge")));
  }
}
