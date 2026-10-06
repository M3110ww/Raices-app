package com.analisis.raices.expresion;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Parser de expresiones matemáticas escrito a mano, sin librerías externas.
 *
 * <p>Usa descenso recursivo sobre esta gramática:
 *
 * <pre>
 *   expresion := termino (('+'|'-') termino)*
 *   termino   := unario (('*'|'/') unario | multiplicación implícita)*
 *   unario    := ('-'|'+') unario | potencia
 *   potencia  := primario ('^' unario)?        asociativa a la derecha
 *   primario  := número | función(args) | identificador | '(' expresion ')'
 * </pre>
 *
 * <p>Detalles que importan:
 *
 * <ul>
 *   <li>{@code **} es lo mismo que {@code ^}, y los corchetes funcionan como paréntesis.
 *   <li>La notación científica solo se reconoce si después de la {@code e} viene un dígito (con
 *       signo opcional), así que {@code 2e^x} se lee como 2·e^x.
 *   <li>Multiplicación implícita: {@code 2x}, {@code 3(x+1)}, {@code x sen(x)}.
 *   <li>Precedencia: {@code -x^2} es −(x²) y {@code 2^-2} es 0.25.
 * </ul>
 *
 * <p>El resultado de {@link #compilar(String)} es un árbol de lambdas ({@link Nodo}), de modo que
 * evaluarlo muchas veces (como hacen los métodos numéricos) no vuelve a pasar por el texto.
 */
public final class Expresion {

  /** Nombres de función reconocidos. Los alias en español están incluidos. */
  private static final Set<String> FUNCIONES =
      Set.of(
          "sin", "sen", "cos", "tan", "tg", "sec", "csc", "cot", "asin", "acos", "atan", "sinh",
          "cosh", "tanh", "exp", "ln", "log", "log10", "log2", "sqrt", "cbrt", "abs");

  private final List<Token> tokens;
  private int i;

  private Expresion(String texto) {
    if (texto == null || texto.isBlank()) {
      throw new ErrorExpresion("Escribe una expresión, por ejemplo: x^2 - 2");
    }
    this.tokens = separarTokens(normalizar(texto));
    this.i = 0;
  }

  /**
   * Compila el texto y devuelve el árbol listo para evaluar.
   *
   * @throws ErrorExpresion si el texto no es una expresión válida
   */
  public static Nodo compilar(String texto) {
    Expresion p = new Expresion(texto);
    Nodo raiz = p.expresion();
    Token t = p.actual();
    if (t.tipo() == Tipo.CIERRA) {
      throw new ErrorExpresion("Hay un paréntesis de cierre de más");
    }
    if (t.tipo() != Tipo.FIN) {
      throw new ErrorExpresion("Sobra algo al final de la expresión: '" + t.texto() + "'");
    }
    return raiz;
  }

  /** Atajo para evaluar una expresión una sola vez. */
  public static double evaluar(String texto, double x) {
    return compilar(texto).eval(x);
  }

  // ---------------------------------------------------------------- tokens

  private enum Tipo {
    NUMERO,
    IDENT,
    OPERADOR,
    ABRE,
    CIERRA,
    COMA,
    FIN
  }

  private record Token(Tipo tipo, String texto, double valor) {}

  /** Cambia por sus equivalentes los símbolos que suelen llegar copiados y pegados. */
  private static String normalizar(String s) {
    return s.replace('−', '-') // signo menos tipográfico
        .replace('–', '-') // raya corta
        .replace('—', '-') // raya larga
        .replace('×', '*') // signo por
        .replace('·', '*') // punto medio
        .replace('÷', '/') // signo dividido
        .replace('⁄', '/'); // barra de fracción
  }

  private static boolean esDigito(char c) {
    return c >= '0' && c <= '9';
  }

  private static boolean esLetra(char c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
  }

  private static List<Token> separarTokens(String s) {
    List<Token> lista = new ArrayList<>();
    int p = 0;
    while (p < s.length()) {
      char c = s.charAt(p);

      if (Character.isWhitespace(c)) {
        p++;
        continue;
      }

      if (esDigito(c) || (c == '.' && p + 1 < s.length() && esDigito(s.charAt(p + 1)))) {
        int ini = p;
        while (p < s.length() && esDigito(s.charAt(p))) {
          p++;
        }
        if (p < s.length() && s.charAt(p) == '.') {
          p++;
          while (p < s.length() && esDigito(s.charAt(p))) {
            p++;
          }
        }
        // La 'e' solo abre un exponente si de verdad le sigue un número; si no,
        // es la constante de Euler y toca multiplicar de forma implícita.
        if (p < s.length() && (s.charAt(p) == 'e' || s.charAt(p) == 'E')) {
          int q = p + 1;
          if (q < s.length() && (s.charAt(q) == '+' || s.charAt(q) == '-')) {
            q++;
          }
          if (q < s.length() && esDigito(s.charAt(q))) {
            p = q;
            while (p < s.length() && esDigito(s.charAt(p))) {
              p++;
            }
          }
        }
        String txt = s.substring(ini, p);
        double v;
        try {
          v = Double.parseDouble(txt);
        } catch (NumberFormatException ex) {
          throw new ErrorExpresion("Número mal escrito: '" + txt + "'");
        }
        lista.add(new Token(Tipo.NUMERO, txt, v));
        continue;
      }

      if (esLetra(c)) {
        int ini = p;
        while (p < s.length() && (esLetra(s.charAt(p)) || esDigito(s.charAt(p)))) {
          p++;
        }
        lista.add(new Token(Tipo.IDENT, s.substring(ini, p), 0));
        continue;
      }

      if (c == '(' || c == '[') {
        lista.add(new Token(Tipo.ABRE, String.valueOf(c), 0));
        p++;
      } else if (c == ')' || c == ']') {
        lista.add(new Token(Tipo.CIERRA, String.valueOf(c), 0));
        p++;
      } else if (c == ',') {
        lista.add(new Token(Tipo.COMA, ",", 0));
        p++;
      } else if (c == '*') {
        if (p + 1 < s.length() && s.charAt(p + 1) == '*') {
          lista.add(new Token(Tipo.OPERADOR, "^", 0));
          p += 2;
        } else {
          lista.add(new Token(Tipo.OPERADOR, "*", 0));
          p++;
        }
      } else if (c == '+' || c == '-' || c == '/' || c == '^') {
        lista.add(new Token(Tipo.OPERADOR, String.valueOf(c), 0));
        p++;
      } else {
        throw new ErrorExpresion("Carácter no válido: '" + c + "'");
      }
    }
    lista.add(new Token(Tipo.FIN, "", 0));
    return lista;
  }

  // ---------------------------------------------------------------- parser

  private Token actual() {
    return tokens.get(i);
  }

  private boolean esOperador(String op) {
    Token t = actual();
    return t.tipo() == Tipo.OPERADOR && t.texto().equals(op);
  }

  /** Indica si aquí puede empezar un primario, señal de multiplicación implícita. */
  private boolean empiezaPrimario() {
    Tipo t = actual().tipo();
    return t == Tipo.NUMERO || t == Tipo.IDENT || t == Tipo.ABRE;
  }

  private Nodo expresion() {
    Nodo izq = termino();
    while (esOperador("+") || esOperador("-")) {
      boolean suma = esOperador("+");
      i++;
      final Nodo a = izq;
      final Nodo b = termino();
      izq = suma ? (x -> a.eval(x) + b.eval(x)) : (x -> a.eval(x) - b.eval(x));
    }
    return izq;
  }

  private Nodo termino() {
    Nodo izq = unario();
    while (true) {
      if (esOperador("*") || esOperador("/")) {
        boolean mult = esOperador("*");
        i++;
        final Nodo a = izq;
        final Nodo b = unario();
        izq = mult ? (x -> a.eval(x) * b.eval(x)) : (x -> a.eval(x) / b.eval(x));
      } else if (empiezaPrimario()) {
        // Multiplicación implícita: 2x, 3(x+1), x sen(x). Se llama a potencia() y
        // no a unario() porque un '-' aquí pertenece a la suma, no a este factor.
        final Nodo a = izq;
        final Nodo b = potencia();
        izq = x -> a.eval(x) * b.eval(x);
      } else {
        return izq;
      }
    }
  }

  private Nodo unario() {
    if (esOperador("-")) {
      i++;
      final Nodo a = unario();
      return x -> -a.eval(x);
    }
    if (esOperador("+")) {
      i++;
      return unario();
    }
    return potencia();
  }

  private Nodo potencia() {
    Nodo base = primario();
    if (esOperador("^")) {
      i++;
      final Nodo a = base;
      // El exponente vuelve a pasar por unario(): así '^' queda asociativa a la
      // derecha (2^3^2 = 2^9) y además admite 2^-2.
      final Nodo b = unario();
      return x -> Math.pow(a.eval(x), b.eval(x));
    }
    return base;
  }

  private Nodo primario() {
    Token t = actual();

    if (t.tipo() == Tipo.NUMERO) {
      i++;
      final double v = t.valor();
      return x -> v;
    }

    if (t.tipo() == Tipo.ABRE) {
      i++;
      Nodo dentro = expresion();
      if (actual().tipo() != Tipo.CIERRA) {
        throw new ErrorExpresion("Falta cerrar un paréntesis");
      }
      i++;
      return dentro;
    }

    if (t.tipo() == Tipo.IDENT) {
      String nombre = t.texto();
      String clave = nombre.toLowerCase(Locale.ROOT);

      if (FUNCIONES.contains(clave)) {
        i++;
        if (actual().tipo() != Tipo.ABRE) {
          throw new ErrorExpresion(
              "La función '" + nombre + "' necesita paréntesis, por ejemplo " + clave + "(x)");
        }
        i++;
        List<Nodo> args = new ArrayList<>();
        if (actual().tipo() != Tipo.CIERRA) {
          args.add(expresion());
          while (actual().tipo() == Tipo.COMA) {
            i++;
            args.add(expresion());
          }
        }
        if (actual().tipo() != Tipo.CIERRA) {
          throw new ErrorExpresion("Falta cerrar un paréntesis");
        }
        i++;
        return aplicar(clave, nombre, args);
      }

      if (clave.equals("x")) {
        i++;
        return x -> x;
      }
      if (clave.equals("pi")) {
        i++;
        return x -> Math.PI;
      }
      if (clave.equals("e")) {
        i++;
        return x -> Math.E;
      }
      throw new ErrorExpresion(
          "Variable o constante desconocida: '" + nombre + "'. Usa x como variable");
    }

    if (t.tipo() == Tipo.OPERADOR) {
      throw new ErrorExpresion("Falta un valor junto al operador '" + t.texto() + "'");
    }
    if (t.tipo() == Tipo.CIERRA) {
      throw new ErrorExpresion("Hay un paréntesis de cierre de más");
    }
    throw new ErrorExpresion("La expresión está incompleta");
  }

  private static Nodo aplicar(String clave, String nombre, List<Nodo> args) {
    // log con dos argumentos es el logaritmo en la base indicada: log(8, 2) = 3.
    if (clave.equals("log") && args.size() == 2) {
      final Nodo v = args.get(0);
      final Nodo b = args.get(1);
      return x -> Math.log(v.eval(x)) / Math.log(b.eval(x));
    }
    if (args.size() != 1) {
      throw new ErrorExpresion(
          "La función '" + nombre + "' espera 1 argumento y recibió " + args.size());
    }
    final Nodo a = args.get(0);
    return switch (clave) {
      case "sin", "sen" -> x -> Math.sin(a.eval(x));
      case "cos" -> x -> Math.cos(a.eval(x));
      case "tan", "tg" -> x -> Math.tan(a.eval(x));
      case "sec" -> x -> 1.0 / Math.cos(a.eval(x));
      case "csc" -> x -> 1.0 / Math.sin(a.eval(x));
      case "cot" -> x -> Math.cos(a.eval(x)) / Math.sin(a.eval(x));
      case "asin" -> x -> Math.asin(a.eval(x));
      case "acos" -> x -> Math.acos(a.eval(x));
      case "atan" -> x -> Math.atan(a.eval(x));
      case "sinh" -> x -> Math.sinh(a.eval(x));
      case "cosh" -> x -> Math.cosh(a.eval(x));
      case "tanh" -> x -> Math.tanh(a.eval(x));
      case "exp" -> x -> Math.exp(a.eval(x));
      case "ln", "log" -> x -> Math.log(a.eval(x));
      case "log10" -> x -> Math.log10(a.eval(x));
      case "log2" -> x -> Math.log(a.eval(x)) / Math.log(2.0);
      case "sqrt" -> x -> Math.sqrt(a.eval(x));
      case "cbrt" -> x -> Math.cbrt(a.eval(x));
      case "abs" -> x -> Math.abs(a.eval(x));
      default -> throw new ErrorExpresion("Función desconocida: '" + nombre + "'");
    };
  }
}
