package com.analisis.raices.web;

import com.analisis.raices.metodos.CatalogoMetodos;
import com.analisis.raices.metodos.Resolutor;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Enlaza el motor numérico con Spring y abre CORS para el frontend.
 *
 * <p>El motor no sabe nada de Spring: se instancia aquí, en un único sitio.
 */
@Configuration
public class Configuracion implements WebMvcConfigurer {

  /**
   * Orígenes autorizados, separados por comas. En Render se pone la URL de Vercel con la variable
   * {@code CORS_ORIGENES}; mientras no esté configurada vale cualquiera.
   */
  @Value("${app.cors.origenes}")
  private String origenes;

  @Bean
  public CatalogoMetodos catalogoMetodos() {
    return new CatalogoMetodos();
  }

  @Bean
  public Resolutor resolutor(CatalogoMetodos catalogo) {
    return new Resolutor(catalogo);
  }

  @Override
  public void addCorsMappings(CorsRegistry registro) {
    String[] patrones = Arrays.stream(origenes.split(",")).map(String::trim).toArray(String[]::new);
    registro
        .addMapping("/api/**")
        .allowedOriginPatterns(patrones)
        .allowedMethods("GET", "POST", "OPTIONS")
        .allowedHeaders("*")
        .maxAge(3600);
  }
}
