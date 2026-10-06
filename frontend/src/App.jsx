import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { intentarCompilar } from './lib/expresion.js';
import { METODOS, buscarMetodo, esCerrado } from './lib/metodos.js';
import { ErrorApi, hayServidor, resolver, servidorDisponible } from './lib/api.js';
import { buscarCambiosDeSigno, vistaPara } from './lib/vista.js';
import { derivadaSimbolica } from './lib/derivada.js';
import { xsDelPaso } from './lib/dibujo.js';

import BotonTema from './components/BotonTema.jsx';
import PanelControles from './components/PanelControles.jsx';
import Lienzo from './components/Lienzo.jsx';
import Reproductor from './components/Reproductor.jsx';
import Cajetin from './components/Cajetin.jsx';
import Convergencia from './components/Convergencia.jsx';
import TablaIteraciones from './components/TablaIteraciones.jsx';

/** Duración base de la animación de un paso, en milisegundos. */
const DURACION_PASO = 900;

/** Estado inicial del formulario: el primer ejemplo de la lista. */
const DATOS_INICIALES = {
  funcion: 'x^3 - x - 2',
  g: 'cbrt(x+2)',
  a: '1',
  b: '2',
  x0: '1',
  x1: '1.5',
  x2: '2',
  derivada: '',
  usarDerivadaManual: false,
  metodo: 'biseccion',
  n: 6,
  maxIteraciones: 100,
  tipoError: 'ABSOLUTO',
};

function temaInicial() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'papel';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'plano' : 'papel';
}

function prefiereSinMovimiento() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Convierte el texto de un campo a número, o null si está vacío o mal escrito. */
function aNumero(texto) {
  if (texto === null || texto === undefined || String(texto).trim() === '') return null;
  const v = Number(String(texto).replace(',', '.'));
  return Number.isFinite(v) ? v : null;
}

export default function App() {
  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [tema, setTema] = useState(temaInicial);
  const [sinMovimiento] = useState(prefiereSinMovimiento);

  const [resultado, setResultado] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [error, setError] = useState(null);
  const [calculando, setCalculando] = useState(false);

  const [paso, setPaso] = useState(-1);
  const [t, setT] = useState(1);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [velocidad, setVelocidad] = useState(1);
  const [acercarEnCadaPaso, setAcercarEnCadaPaso] = useState(false);
  const [decimales, setDecimales] = useState(6);

  const [vista, setVista] = useState({ x0: -3, x1: 3, y0: -3, y1: 3 });

  const [motor, setMotor] = useState(hayServidor() ? 'java' : 'navegador');
  const [estadoServidor, setEstadoServidor] = useState(
    hayServidor() ? 'conectando' : 'sin-configurar',
  );

  const [derivadaAuto, setDerivadaAuto] = useState(null);
  const [avisoDerivada, setAvisoDerivada] = useState(null);

  const metodo = useMemo(() => {
    try {
      return buscarMetodo(datos.metodo);
    } catch {
      return METODOS[0];
    }
  }, [datos.metodo]);

  // --------------------------------------------------------------- tema

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema);
  }, [tema]);

  // ------------------------------------------------- compilación en vivo

  const compiladaF = useMemo(() => intentarCompilar(datos.funcion), [datos.funcion]);
  const compiladaG = useMemo(
    () => (datos.g.trim() === '' ? { fn: null, error: null } : intentarCompilar(datos.g)),
    [datos.g],
  );

  const f = compiladaF.fn;
  const g = compiladaG.fn;

  // ------------------------------------------------------ encuadre

  /** Valores iniciales que el método en uso necesita, ya como números. */
  const puntosIniciales = useCallback(() => {
    const porClave = {
      a: aNumero(datos.a),
      b: aNumero(datos.b),
      x0: aNumero(datos.x0),
      x1: aNumero(datos.x1),
      x2: aNumero(datos.x2),
    };
    return metodo.requiere
      .filter((clave) => clave !== 'g')
      .map((clave) => porClave[clave])
      .filter((v) => v !== null);
  }, [datos.a, datos.b, datos.x0, datos.x1, datos.x2, metodo]);

  /** Funciones con las que se mide la escala vertical. */
  const funcionesVerticales = useCallback(() => {
    // En punto fijo lo que se dibuja es g(x) contra y = x, así que es eso lo que
    // tiene que caber en la pantalla, no f.
    if (metodo.id === 'punto_fijo' && g) return [g, (x) => x];
    return f ? [f] : [() => 0];
  }, [metodo, f, g]);

  const reencuadrar = useCallback(
    (res = null, pasoActual = -1) => {
      const fns = funcionesVerticales();
      let xs;
      let anchoMinimo = 1.5;

      if (res && pasoActual >= 0 && acercarEnCadaPaso) {
        // Solo los puntos del paso visible, pegados: sin ancho mínimo.
        xs = xsDelPaso(res.metodo, res.iteraciones[pasoActual]);
        anchoMinimo = 0;
      } else if (res) {
        xs = [
          ...puntosIniciales(),
          ...res.iteraciones.map((it) => it.x).filter((n) => Number.isFinite(n)),
        ];
      } else {
        xs = puntosIniciales();
      }

      if (xs.length === 0) xs = [-2, 2];
      setVista(vistaPara(fns, xs, [], anchoMinimo));
    },
    [funcionesVerticales, puntosIniciales, acercarEnCadaPaso],
  );

  /** Cambia datos del formulario: descarta el resultado y vuelve a encuadrar. */
  const actualizar = useCallback((cambios) => {
    setDatos((previos) => ({ ...previos, ...cambios }));
    setResultado(null);
    setPaso(-1);
    setReproduciendo(false);
    setAviso(null);
    setError(null);
  }, []);

  // Reencuadra cuando cambian los datos y no hay resultado en pantalla.
  useEffect(() => {
    if (resultado) return;
    reencuadrar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos.funcion, datos.g, datos.a, datos.b, datos.x0, datos.x1, datos.x2, datos.metodo]);

  // Con "acercar en cada paso" el encuadre sigue a la animación.
  useEffect(() => {
    if (!resultado || paso < 0 || !acercarEnCadaPaso) return;
    reencuadrar(resultado, paso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, acercarEnCadaPaso, resultado]);

  // ------------------------------------------------------ estado del servidor

  useEffect(() => {
    if (!hayServidor()) {
      setEstadoServidor('sin-configurar');
      return;
    }
    let vivo = true;
    setEstadoServidor('conectando');
    servidorDisponible().then((ok) => {
      if (vivo) setEstadoServidor(ok ? 'conectado' : 'caido');
    });
    return () => {
      vivo = false;
    };
  }, []);

  const reintentarServidor = useCallback(async () => {
    if (!hayServidor()) return;
    setEstadoServidor('conectando');
    const ok = await servidorDisponible();
    setEstadoServidor(ok ? 'conectado' : 'caido');
  }, []);

  // ------------------------------------------------------ derivada simbólica

  useEffect(() => {
    if (metodo.id !== 'newton' || datos.usarDerivadaManual) return;
    let vivo = true;
    setDerivadaAuto(null);
    setAvisoDerivada(null);
    derivadaSimbolica(datos.funcion).then(({ expr, error: err }) => {
      if (!vivo) return;
      setDerivadaAuto(expr);
      setAvisoDerivada(err);
    });
    return () => {
      vivo = false;
    };
  }, [metodo.id, datos.funcion, datos.usarDerivadaManual]);

  /** Derivada que se enviará al motor: la escrita a mano o la simbólica. */
  const derivadaEfectiva = datos.usarDerivadaManual
    ? datos.derivada
    : (derivadaAuto ?? '');

  // ------------------------------------------------------------- calcular

  const solicitud = useCallback(
    () => ({
      metodo: metodo.id,
      funcion: datos.funcion,
      g: metodo.requiere.includes('g') ? datos.g : null,
      derivada: metodo.id === 'newton' && derivadaEfectiva.trim() !== '' ? derivadaEfectiva : null,
      a: aNumero(datos.a),
      b: aNumero(datos.b),
      x0: aNumero(datos.x0),
      x1: aNumero(datos.x1),
      x2: aNumero(datos.x2),
      tolerancia: Math.pow(10, -datos.n),
      maxIteraciones: Number(datos.maxIteraciones),
      tipoError: datos.tipoError,
    }),
    [datos, metodo, derivadaEfectiva],
  );

  const yaAnimado = useRef(null);

  const calcular = useCallback(async () => {
    setError(null);
    setAviso(null);
    setCalculando(true);
    try {
      const { resultado: res, aviso: av } = await resolver(solicitud(), motor);
      setResultado(res);
      setAviso(av);
      yaAnimado.current = null;
      reencuadrar(res, -1);
      setPaso(0);
      setT(sinMovimiento ? 1 : 0);
      setReproduciendo(true); // al calcular, se reproduce solo
      if (av) setEstadoServidor('caido');
    } catch (e) {
      setResultado(null);
      setPaso(-1);
      setReproduciendo(false);
      setError(e instanceof ErrorApi ? e.message : e.message);
    } finally {
      setCalculando(false);
    }
  }, [solicitud, motor, reencuadrar, sinMovimiento]);

  // ------------------------------------------------------------ animación

  const total = resultado?.iteraciones.length ?? 0;

  useEffect(() => {
    if (!resultado || paso < 0) {
      setT(1);
      return undefined;
    }

    const clave = String(paso);
    const avanzar = () => {
      if (paso < total - 1) setPaso(paso + 1);
      else setReproduciendo(false);
    };

    // Un paso ya animado no se vuelve a animar: así al pausar o al terminar la
    // reproducción no se repite el dibujo del paso actual.
    if (yaAnimado.current === clave) {
      setT(1);
      if (!reproduciendo) return undefined;
      const id = setTimeout(avanzar, 180 / velocidad);
      return () => clearTimeout(id);
    }

    if (sinMovimiento) {
      setT(1);
      yaAnimado.current = clave;
      if (!reproduciendo) return undefined;
      const id = setTimeout(avanzar, 600 / velocidad);
      return () => clearTimeout(id);
    }

    let cancelado = false;
    let id = 0;
    const duracion = DURACION_PASO / velocidad;
    const inicio = performance.now();
    const tic = (ahora) => {
      if (cancelado) return;
      const p = Math.min(1, (ahora - inicio) / duracion);
      setT(p);
      if (p < 1) {
        id = requestAnimationFrame(tic);
        return;
      }
      yaAnimado.current = clave;
      if (reproduciendo) avanzar();
    };
    id = requestAnimationFrame(tic);
    return () => {
      cancelado = true;
      cancelAnimationFrame(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, resultado, reproduciendo, velocidad, sinMovimiento, total]);

  const irAPaso = useCallback(
    (nuevo) => {
      if (!resultado) return;
      const limitado = Math.min(total - 1, Math.max(0, nuevo));
      if (limitado !== paso) yaAnimado.current = null;
      setPaso(limitado);
    },
    [resultado, total, paso],
  );

  const alternarReproduccion = useCallback(() => {
    if (!resultado) return;
    if (reproduciendo) {
      setReproduciendo(false);
      return;
    }
    if (paso >= total - 1) {
      yaAnimado.current = null;
      setPaso(0);
    }
    setReproduciendo(true);
  }, [resultado, reproduciendo, paso, total]);

  // ------------------------------------------------------------- teclado

  useEffect(() => {
    const enCampo = (destino) => {
      const etiqueta = destino?.tagName;
      return etiqueta === 'INPUT' || etiqueta === 'TEXTAREA' || etiqueta === 'SELECT';
    };
    const alPulsar = (evento) => {
      // Si una fila de la tabla o un punto de la gráfica ya atendió la tecla, no
      // se vuelve a tratar aquí.
      if (!resultado || evento.defaultPrevented || enCampo(evento.target)) return;
      if (evento.key === ' ') {
        evento.preventDefault();
        alternarReproduccion();
      } else if (evento.key === 'ArrowRight') {
        evento.preventDefault();
        setReproduciendo(false);
        irAPaso(paso + 1);
      } else if (evento.key === 'ArrowLeft') {
        evento.preventDefault();
        setReproduciendo(false);
        irAPaso(paso - 1);
      }
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [resultado, paso, alternarReproduccion, irAPaso]);

  // -------------------------------------------------- buscar cambio de signo

  const buscarEnLaVista = useCallback(() => {
    if (!f) return;
    const encontrados = buscarCambiosDeSigno(f, vista.x0, vista.x1);
    if (encontrados.length === 0) {
      setError('No se encontró ningún cambio de signo en lo que se ve. Mueve o amplía la gráfica.');
      return;
    }
    const mejor = encontrados[0];
    setError(null);
    actualizar({ a: String(mejor.a), b: String(mejor.b) });
  }, [f, vista, actualizar]);

  // ----------------------------------------------------------------- render

  const iteracionActual = paso >= 0 ? resultado?.iteraciones?.[paso] : null;

  return (
    <div className="hoja">
      <header className="cabecera">
        <div className="cabecera-titulo">
          <h1>Raíces de ecuaciones</h1>
          <p className="subtitulo">
            Métodos numéricos para resolver f(x) = 0, paso a paso y sobre papel milimetrado
          </p>
        </div>
        <BotonTema tema={tema} onCambiar={setTema} />
      </header>

      <div className="tablero">
        <PanelControles
          datos={datos}
          actualizar={actualizar}
          metodo={metodo}
          errorFuncion={compiladaF.error}
          errorG={compiladaG.error}
          derivadaAuto={derivadaAuto}
          avisoDerivada={avisoDerivada}
          motor={motor}
          onMotor={setMotor}
          estadoServidor={estadoServidor}
          onReintentar={reintentarServidor}
          onBuscarCambioDeSigno={buscarEnLaVista}
          onCalcular={calcular}
          calculando={calculando}
          puedeCalcular={!compiladaF.error && !calculando}
        />

        <section className="bloque bloque-lienzo" aria-label="Gráfica de la función">
          <Lienzo
            vista={vista}
            onVista={setVista}
            f={f}
            g={g}
            tema={tema}
            resultado={resultado}
            paso={paso}
            t={t}
            nombreFuncion={`f(x) = ${datos.funcion}`}
            nombreG={`g(x) = ${datos.g}`}
            onEncuadrar={() => reencuadrar(resultado, acercarEnCadaPaso ? paso : -1)}
          />
        </section>

        <main className="area-resto">
          {(error || aviso) && (
            <div className="mensajes">
              {error && (
                <p className="mensaje mensaje-error" role="alert">
                  <strong>!</strong> {error}
                </p>
              )}
              {aviso && (
                <p className="mensaje mensaje-aviso" role="status">
                  <strong>i</strong> {aviso}
                </p>
              )}
            </div>
          )}

          <Reproductor
            total={total}
            paso={paso}
            reproduciendo={reproduciendo}
            velocidad={velocidad}
            acercar={acercarEnCadaPaso}
            onPaso={(p) => {
              setReproduciendo(false);
              irAPaso(p);
            }}
            onAlternar={alternarReproduccion}
            onVelocidad={setVelocidad}
            onAcercar={(valor) => {
              setAcercarEnCadaPaso(valor);
              if (!valor) reencuadrar(resultado, -1);
            }}
          />

          <div className="fila-resultado">
            <Cajetin
              resultado={resultado}
              funcion={datos.funcion}
              iteracion={iteracionActual}
              decimales={decimales}
            />
            <Convergencia
              resultado={resultado}
              paso={paso}
              tolerancia={Math.pow(10, -datos.n)}
              onIrAPaso={(p) => {
                setReproduciendo(false);
                irAPaso(p);
              }}
            />
          </div>

          <TablaIteraciones
            resultado={resultado}
            paso={paso}
            decimales={decimales}
            onDecimales={setDecimales}
            onIrAPaso={(p) => {
              setReproduciendo(false);
              irAPaso(p);
            }}
          />
        </main>
      </div>

      <footer className="pie">
        <span>
          Motor {resultado ? resultado.motor : motor === 'java' ? 'Java (servidor)' : 'navegador'}
        </span>
        <span>
          {esCerrado(metodo) ? 'Método cerrado' : 'Método abierto'} · {metodo.nombre}
        </span>
        <span>Espacio: reproducir · ← →: paso a paso</span>
      </footer>
    </div>
  );
}
