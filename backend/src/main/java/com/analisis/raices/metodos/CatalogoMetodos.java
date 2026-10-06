package com.analisis.raices.metodos;

import com.analisis.raices.modelo.InfoMetodo;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Registro ordenado de los métodos disponibles.
 *
 * <p>Para añadir un método nuevo basta con crear su clase y sumarla a esta lista: la API, la tabla y
 * el selector de la interfaz se enteran solos.
 */
public final class CatalogoMetodos {

  private final Map<String, MetodoRaiz> porId = new LinkedHashMap<>();

  public CatalogoMetodos() {
    this(
        List.of(
            new Biseccion(),
            new FalsaPosicion(),
            new PuntoFijo(),
            new Newton(),
            new Secante(),
            new Steffensen(),
            new Muller()));
  }

  public CatalogoMetodos(List<MetodoRaiz> metodos) {
    for (MetodoRaiz m : metodos) {
      porId.put(m.id(), m);
    }
  }

  /**
   * Busca un método por su id.
   *
   * @throws IllegalArgumentException si no existe
   */
  public MetodoRaiz buscar(String id) {
    MetodoRaiz m = id == null ? null : porId.get(id.trim());
    if (m == null) {
      throw new IllegalArgumentException(
          "Método desconocido: '" + id + "'. Disponibles: " + String.join(", ", porId.keySet()));
    }
    return m;
  }

  /** Fichas de todos los métodos, en el orden del registro. */
  public List<InfoMetodo> listar() {
    return porId.values().stream().map(MetodoRaiz::info).collect(Collectors.toList());
  }
}
