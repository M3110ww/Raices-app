# Raíces de ecuaciones · Análisis numérico

Aplicación web para encontrar raíces de ecuaciones **f(x) = 0** con siete métodos
numéricos clásicos, viendo cada iteración dibujada sobre papel milimetrado.

No es solo una calculadora: cada paso se **anima** sobre la gráfica (la cuerda de
la falsa posición, la tangente de Newton, la telaraña del punto fijo, la parábola
de Müller…), se puede recorrer con un reproductor y se acompaña de la tabla de
iteraciones y de la curva de convergencia en escala logarítmica.

## Qué incluye

**Métodos cerrados** (necesitan un intervalo donde f cambie de signo):

| id               | Método          | Necesita |
| ---------------- | --------------- | -------- |
| `biseccion`      | Bisección       | `a`, `b` |
| `falsa_posicion` | Falsa posición  | `a`, `b` |

**Métodos abiertos** (parten de una o varias aproximaciones):

| id            | Método         | Necesita           |
| ------------- | -------------- | ------------------ |
| `punto_fijo`  | Punto fijo     | `x0`, `g`          |
| `newton`      | Newton-Raphson | `x0`               |
| `secante`     | Secante        | `x0`, `x1`         |
| `steffensen`  | Steffensen     | `x0`               |
| `muller`      | Müller         | `x0`, `x1`, `x2`   |

Además:

- **Parser de expresiones propio**, sin librerías: multiplicación implícita
  (`2x`, `3(x+1)`, `x sen(x)`), potencias con `^` o `**`, corchetes como
  paréntesis y mensajes de error en español.
- **Dos motores con el mismo algoritmo**: la API Java y una copia en JavaScript.
  Si el servidor no está configurado o no responde, el cálculo se hace en el
  navegador y se avisa. Las pruebas de los dos lados comprueban que devuelven el
  mismo número de iteraciones (ver [Paridad entre los dos motores](#paridad-entre-los-dos-motores)).
- **Derivada simbólica** para Newton (con opción de escribirla a mano).
- **Gráfica propia en canvas**, sin librerías de charts: papel milimetrado,
  arrastrar para mover, rueda para hacer zoom, lectura de f(x) bajo el cursor.
- **Tres criterios de error**: absoluto, relativo y residual.
- **Dos temas**: papel (claro) y plano azul (cianotipo).
- **Exportación a CSV** de la tabla de iteraciones.

## Estructura del proyecto

```
raices-app/
├── backend/                      API REST en Java 21 + Spring Boot
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd, .mvn/     Maven Wrapper (no hace falta instalar Maven)
│   ├── Dockerfile                Multietapa, para Render
│   └── src/
│       ├── main/java/com/analisis/raices/
│       │   ├── expresion/        Parser propio: Expresion, Nodo, ErrorExpresion
│       │   ├── modelo/           Records del JSON: Solicitud, Resultado, Iteracion…
│       │   ├── metodos/          Motor: Contexto, los 7 métodos, Catálogo, Resolutor
│       │   └── web/              Spring: configuración, controlador, errores
│       └── test/java/…           41 pruebas JUnit
│
├── frontend/                     React + Vite
│   └── src/
│       ├── lib/
│       │   ├── expresion.js      Port exacto del parser Java
│       │   ├── metodos.js        Port exacto del motor Java
│       │   ├── api.js            Llamadas a la API y respaldo local
│       │   ├── derivada.js       Derivada simbólica (mathjs, carga diferida)
│       │   ├── vista.js          Encuadre y búsqueda de cambios de signo
│       │   ├── formato.js        Números, superíndices y CSV
│       │   ├── dibujo.js         Todo el dibujo del canvas
│       │   └── *.test.js         41 pruebas vitest, las mismas que en Java
│       ├── components/           Panel, lienzo, reproductor, cajetín, tabla…
│       ├── App.jsx
│       └── estilos.css
│
├── vercel.json                   Despliegue del frontend
├── render.yaml                   Despliegue del backend
└── .github/workflows/ci.yml      Pruebas de los dos lados en cada push
```

## Requisitos

| Herramienta | Versión  | Para qué                                        |
| ----------- | -------- | ----------------------------------------------- |
| Java (JDK)  | 21       | Backend                                         |
| Node.js     | ≥ 20.19  | Frontend (probado con 22)                       |
| Maven       | opcional | El repositorio trae el wrapper (`./mvnw`)       |
| Docker      | opcional | Solo si quieres probar la imagen en local       |

## Cómo ejecutarlo en local

### Backend

```bash
cd backend
./mvnw spring-boot:run          # en Windows: mvnw.cmd spring-boot:run
```

Queda escuchando en `http://localhost:8080`. Comprobación rápida:

```bash
curl http://localhost:8080/api/salud
# {"estado":"ok","motor":"java"}
```

Si tienes Maven instalado, `mvn spring-boot:run` funciona igual.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # y descomenta VITE_API_URL=http://localhost:8080
npm run dev
```

Se abre en `http://localhost:5173`. En el panel lateral, el estado debería decir
**«Java conectado»**.

Sin `.env` la aplicación también funciona: calcula todo en el navegador con el
mismo algoritmo y el selector de motor queda en «Navegador».

## Pruebas

```bash
cd backend  && ./mvnw -B verify     # 41 pruebas JUnit
cd frontend && npm test             # 41 pruebas vitest
```

Las pruebas de los dos motores comprueban los **mismos** números: con
f(x) = x² − 2 y tolerancia 1e-10, bisección en [0, 2] tarda 35 iteraciones, la
falsa posición 15, Newton desde x₀ = 1 tarda 5, la secante desde 1 y 2 tarda 7,
el punto fijo con g = (x + 2/x)/2 tarda 5, Steffensen desde 1.5 tarda 5 y Müller
desde 0, 1 y 2 tarda 2. Si un cambio rompe la paridad entre Java y JavaScript,
estas cifras lo delatan.

## Paridad entre los dos motores

Los dos motores están escritos para dar el mismo resultado, y se comprobó
levantando el backend y comparando su JSON con el del motor del navegador en 22
casos (los siete métodos, los seis ejemplos de la interfaz, divergencias, tope de
iteraciones, raíz exacta y los tres tipos de error):

- **La estructura coincide siempre**: mismo `iteracionesRealizadas`, mismo
  `mensaje` carácter por carácter, mismas `columnas`, mismo `convergio` y los
  mismos campos en `null`. 0 diferencias estructurales de 22 casos.
- **19 de los 22 casos salen idénticos bit a bit.**
- Los otros 3 son los que usan `exp`, `cos` o `ln`. Ahí los valores difieren en
  el último bit, porque **IEEE 754 no obliga a que las funciones
  trascendentes den un resultado exacto**: la JVM y el motor V8 del navegador
  redondean distinto en el bit menos significativo. Medido sobre esos casos, la
  raíz devuelta coincide con una diferencia relativa máxima de **2.7e-16**, es
  decir poco más de un épsilon de máquina (2.2e-16).

En la práctica esto no cambia ninguna decisión del método, porque esa diferencia
está muy por debajo de cualquier tolerancia razonable; solo se nota si se
comparan los dígitos 16 y 17 de un valor intermedio. Conseguir igualdad bit a
bit también con funciones trascendentes exigiría reimplementar `exp`, `ln` y las
trigonométricas en uno de los dos lados, lo que traería mucho más riesgo que
beneficio.

> Donde sí se amplifica es en la columna `f′(xi)` de Newton cuando no se escribe
> la derivada: la diferencia central divide por 2·10⁻⁶, así que un bit de
> diferencia en f se convierte en unas 10⁻¹⁰ en f′. Enviando la derivada
> simbólica el valor vuelve a ser idéntico.

## Subirlo a GitHub

```bash
git init
git add .
git commit -m "Primera versión: métodos para encontrar raíces"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/raices-app.git
git push -u origin main
```

## Despliegue

Vercel no ejecuta Java, así que el backend va aparte, en Render.

### 1. Backend en Render

1. Entra en [render.com](https://render.com) → **New** → **Blueprint**.
2. Elige este repositorio. Render leerá `render.yaml` y creará un servicio web
   con Docker, plan gratuito y `healthCheckPath` en `/api/salud`.
3. Apunta la URL que te da. Si el nombre `raices-api` ya está cogido por otra
   persona, Render le añade un sufijo: la instancia actual quedó en
   `https://raices-api-cbhg.onrender.com`.

> Hay que crearlo como **Blueprint**, no como *Web Service* a secas. Un servicio
> creado a mano ignora `render.yaml`, y con ello el `rootDir: backend`: Render
> busca entonces un `Dockerfile` en la raíz del repositorio, donde no existe, y
> el despliegue falla con `open Dockerfile: no such file or directory`.

> El plan gratuito apaga el servicio cuando nadie lo usa, y despertarlo tarda
> hasta un minuto. Por eso el frontend espera 60 segundos antes de darlo por
> caído, y si no contesta calcula en el navegador.

### 2. Frontend en Vercel

1. Entra en [vercel.com](https://vercel.com) → **Add New** → **Project** e
   importa el repositorio.
2. Pon el *Root Directory* en **`./`** y el *Application Preset* en **Other**.
   Vercel detecta el Vite de `frontend/` y propone ese directorio como raíz,
   pero el `vercel.json` ya entra en la carpeta por su cuenta: con ambas cosas
   la ruta se duplica y el build muere con `cd: frontend: No such file or
   directory`. Los campos de *Build and Output Settings* se dejan vacíos, que
   el `vercel.json` ya los aporta.
3. **Antes de pulsar Deploy**, despliega *Environment Variables* y añade:

   ```
   VITE_API_URL = https://raices-api-cbhg.onrender.com
   ```

   Vite incrusta esta variable en el bundle durante el build; no la lee al
   cargar la página. Si se añade después del primer despliegue, hay que volver
   a desplegar para que surta efecto.

La instancia actual quedó en `https://raices-app-drab.vercel.app`.

### 3. Cerrar CORS

Con la URL de Vercel ya conocida, vuelve a Render → **Environment** y cambia la
variable de entorno del backend:

```
CORS_ORIGENES = https://raices-app-drab.vercel.app
```

Sin barra al final: el navegador envía el `Origin` sin ella y la comparación es
exacta. Admite varios orígenes separados por comas, lo que resulta útil para
conservar `http://localhost:5173` durante el desarrollo. Al guardar, Render
reinicia el servicio.

## En producción

| Pieza | URL |
| --- | --- |
| Frontend (Vercel) | <https://raices-app-drab.vercel.app> |
| API (Render) | <https://raices-api-cbhg.onrender.com> |

## Documentación de la API

Base: `https://<tu-backend>/api`

### `GET /api/salud`

```json
{ "estado": "ok", "motor": "java" }
```

### `GET /api/metodos`

Devuelve los siete métodos con su descripción, lo que necesita cada uno y las
columnas de su tabla:

```json
[
  {
    "id": "newton",
    "nombre": "Newton-Raphson",
    "descripcion": "Sigue la tangente de f en x_i hasta cortar el eje x: …",
    "requiere": ["x0"],
    "columnas": [
      { "clave": "xi", "etiqueta": "xi" },
      { "clave": "fxi", "etiqueta": "f(xi)" },
      { "clave": "dfxi", "etiqueta": "f′(xi)" },
      { "clave": "xi1", "etiqueta": "xi+1" }
    ]
  }
]
```

### `POST /api/raices/resolver`

Petición:

```json
{
  "metodo": "newton",
  "funcion": "x^3 - x - 2",
  "x0": 1,
  "tolerancia": 1e-6,
  "maxIteraciones": 100,
  "tipoError": "ABSOLUTO"
}
```

Respuesta real, recortada a la primera iteración y la primera columna:

```json
{
  "metodo": "newton",
  "nombreMetodo": "Newton-Raphson",
  "convergio": true,
  "raiz": 1.5213797068045676,
  "fRaiz": 0,
  "errorFinal": 2.9285764924225077e-9,
  "iteracionesRealizadas": 6,
  "mensaje": "Raíz exacta: f(x) = 0 en la iteración 6.",
  "columnas": [{ "clave": "xi", "etiqueta": "xi" }],
  "iteraciones": [
    {
      "n": 1,
      "x": 2.0000000000267555,
      "fx": 4.00000000029431,
      "error": 1.0000000000267555,
      "valores": {
        "xi": 1,
        "fxi": -2,
        "dfxi": 1.999999999946489,
        "xi1": 2.0000000000267555
      }
    }
  ],
  "tiempoMs": 6,
  "motor": "java"
}
```

Dos detalles que se ven en esta respuesta:

- `dfxi` no sale exactamente 2 porque no se envió `derivada`, así que Newton usó
  la diferencia central. Mandando `"derivada": "3x^2 - 1"` los valores salen
  limpios.
- Termina con «Raíz exacta» y no con «Convergió»: en la sexta iteración f(x) dio
  exactamente 0 en coma flotante, y esa comprobación va antes que la de la
  tolerancia.

Un error de la petición responde **400** con el motivo en español:

```json
{ "error": "f(a) y f(b) tienen el mismo signo, así que no se garantiza una raíz en [a, b]. Elige un intervalo donde f cambie de signo" }
```

#### Campos de la petición

| Campo           | Tipo   | Obligatorio      | Por omisión | Notas                                         |
| --------------- | ------ | ---------------- | ----------- | --------------------------------------------- |
| `metodo`        | texto  | sí               | —           | uno de los siete `id`                         |
| `funcion`       | texto  | sí               | —           | expresión de f(x)                             |
| `g`             | texto  | solo punto fijo  | —           | expresión de g(x)                             |
| `derivada`      | texto  | no               | —           | f′(x); si falta, Newton deriva numéricamente  |
| `a`, `b`        | número | métodos cerrados | —           | extremos del intervalo                        |
| `x0`, `x1`, `x2`| número | según el método  | —           | aproximaciones iniciales                      |
| `tolerancia`    | número | no               | `1e-6`      | tiene que ser mayor que cero                  |
| `maxIteraciones`| entero | no               | `100`       | entre 1 y 1000                                |
| `tipoError`     | texto  | no               | `ABSOLUTO`  | `ABSOLUTO`, `RELATIVO` o `RESIDUAL`           |

#### Qué campos pide cada método

| Método          | `a` | `b` | `x0` | `x1` | `x2` | `g` |
| --------------- | :-: | :-: | :--: | :--: | :--: | :-: |
| `biseccion`     |  ✓  |  ✓  |      |      |      |     |
| `falsa_posicion`|  ✓  |  ✓  |      |      |      |     |
| `punto_fijo`    |     |     |  ✓   |      |      |  ✓  |
| `newton`        |     |     |  ✓   |      |      |     |
| `secante`       |     |     |  ✓   |  ✓   |      |     |
| `steffensen`    |     |     |  ✓   |      |      |     |
| `muller`        |     |     |  ✓   |  ✓   |  ✓   |     |

#### Columnas de la tabla por método

| Método                        | Claves de `valores`                                  |
| ----------------------------- | ---------------------------------------------------- |
| `biseccion`, `falsa_posicion` | `a`, `b`, `xr`, `fa`, `fb`, `fxr`                    |
| `punto_fijo`                  | `xi`, `gxi`, `fxi1`                                  |
| `newton`                      | `xi`, `fxi`, `dfxi`, `xi1`                           |
| `secante`                     | `xim1`, `xi`, `fxim1`, `fxi`, `xi1`                  |
| `steffensen`                  | `xi`, `fxi`, `z`, `fxifx`, `xi1`                     |
| `muller`                      | `x0`, `x1`, `x2`, `x3` (+ `pa`, `pb`, `pc` ocultos)  |

> **NaN e Infinito viajan como `null`**, porque no son JSON válido. Lo mismo pasa
> con `raiz`, `fRaiz` y `errorFinal` cuando un método se escapa.

## Sintaxis de funciones

| Qué                        | Cómo se escribe                                        |
| -------------------------- | ------------------------------------------------------ |
| Variable                   | `x`                                                    |
| Constantes                 | `pi`, `e`                                              |
| Operadores                 | `+` `-` `*` `/` `^` (y `**` como sinónimo de `^`)      |
| Agrupar                    | `( )` o `[ ]`                                          |
| Multiplicación implícita   | `2x`, `3(x+1)`, `x sen(x)`                             |
| Notación científica         | `1e-3`, `1.5e3`                                        |
| Trigonométricas            | `sin`/`sen`, `cos`, `tan`/`tg`, `sec`, `csc`, `cot`    |
| Inversas                   | `asin`, `acos`, `atan`                                 |
| Hiperbólicas               | `sinh`, `cosh`, `tanh`                                 |
| Exponencial y logaritmos   | `exp`, `ln`, `log` (natural), `log(x, base)`, `log10`, `log2` |
| Raíces y valor absoluto    | `sqrt`, `cbrt`, `abs`                                  |

Detalles que conviene conocer:

- `-x^2` es **−(x²)**, y `2^-2` vale `0.25`.
- `^` es asociativa a la derecha: `2^3^2` es `2^9`, no `(2^3)^2`.
- La `e` solo abre un exponente si le sigue un número, así que **`2e^x` se lee
  como 2·eˣ**, no como una notación científica incompleta.
- `log(x)` es el logaritmo natural (igual que `ln`); para otra base, `log(x, b)`.

## Añadir un método nuevo

El catálogo es el único sitio donde se registran los métodos, así que hay que
tocar cinco cosas:

1. **Clase Java** en `backend/src/main/java/com/analisis/raices/metodos/`, que
   herede de `MetodoRaiz` e implemente `id()`, `nombre()`, `descripcion()`,
   `requiere()`, `columnas()` y `ejecutar()`. Dentro de `ejecutar()`, el bucle
   solo tiene que calcular la siguiente estimación y llamar a
   `ctx.agregar(x, fx, error, valores)`: el contexto decide cuándo parar.

2. **Registro en el catálogo**: añadirla a la lista del constructor de
   `CatalogoMetodos`.

3. **Misma entrada en `frontend/src/lib/metodos.js`**: un objeto con las mismas
   `id`, `nombre`, `descripcion`, `requiere`, `columnas` y un `ejecutar` que
   reproduzca el algoritmo paso por paso, y sumarlo al array `METODOS`.
   Los dos lados tienen que dar el mismo JSON.

4. **`case` en `frontend/src/lib/dibujo.js`**, dentro de `dibujarPaso`, para
   dibujar su animación; y su entrada en `CLAVES_X` para que «acercar en cada
   paso» sepa cuáles de sus valores son coordenadas x.

5. **Pruebas en los dos lados**, con el mismo caso y el mismo número de
   iteraciones esperado: `MetodosTest.java` y `metodos.test.js`.

## Atajos de teclado

| Tecla      | Qué hace                  |
| ---------- | ------------------------- |
| `Espacio`  | Reproducir / pausar       |
| `←` `→`    | Paso anterior / siguiente |

En la gráfica: arrastrar mueve la vista, la rueda hace zoom centrado en el cursor
(con `Shift` solo en x, con `Alt` solo en y) y el doble clic vuelve a encuadrar.
"# Raices-app" 
