import { useCallback, useEffect, useRef, useState } from 'react';

import { dibujarEscena, leerTema } from '../lib/dibujo.js';

/**
 * Lienzo de la gráfica.
 *
 * Se encarga solo de la interacción (arrastrar, rueda, cursor, tamaño) y delega
 * todo el pintado en `dibujo.js`. El lienzo se redimensiona con el
 * devicePixelRatio para que las líneas de 1 px salgan nítidas también en
 * pantallas Retina.
 */
export default function Lienzo({
  vista,
  onVista,
  f,
  g,
  resultado,
  paso,
  t,
  nombreFuncion,
  nombreG,
  onEncuadrar,
}) {
  const contenedor = useRef(null);
  const lienzo = useRef(null);
  const arrastre = useRef(null);
  const [tamano, setTamano] = useState({ ancho: 720, alto: 420 });
  const [cursor, setCursor] = useState(null);

  // El tamaño real lo manda el CSS; aquí solo se escucha.
  useEffect(() => {
    const elemento = contenedor.current;
    if (!elemento) return undefined;
    const observador = new ResizeObserver((entradas) => {
      const caja = entradas[0].contentRect;
      setTamano({
        ancho: Math.max(240, Math.floor(caja.width)),
        alto: Math.max(200, Math.floor(caja.height)),
      });
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  // Repintado. La paleta se lee de las variables CSS en cada pasada.
  useEffect(() => {
    const elemento = lienzo.current;
    if (!elemento) return;
    const dpr = window.devicePixelRatio || 1;
    elemento.width = Math.round(tamano.ancho * dpr);
    elemento.height = Math.round(tamano.alto * dpr);
    elemento.style.width = `${tamano.ancho}px`;
    elemento.style.height = `${tamano.alto}px`;

    const c = elemento.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    dibujarEscena(c, {
      ancho: tamano.ancho,
      alto: tamano.alto,
      vista,
      tema: leerTema(elemento),
      f,
      g,
      resultado,
      paso,
      t,
      cursor,
      nombreFuncion,
      nombreG,
    });
  }, [tamano, vista, f, g, resultado, paso, t, cursor, nombreFuncion, nombreG]);

  const posicion = (evento) => {
    const caja = lienzo.current.getBoundingClientRect();
    return { px: evento.clientX - caja.left, py: evento.clientY - caja.top };
  };

  // La rueda se escucha a mano porque React la registra como pasiva y entonces
  // no se puede evitar el desplazamiento de la página.
  useEffect(() => {
    const elemento = lienzo.current;
    if (!elemento) return undefined;

    const alGirar = (evento) => {
      evento.preventDefault();
      const caja = elemento.getBoundingClientRect();
      const px = evento.clientX - caja.left;
      const py = evento.clientY - caja.top;

      const factor = Math.exp(evento.deltaY * 0.0012);
      const soloX = evento.shiftKey;
      const soloY = evento.altKey;

      // El punto bajo el cursor se queda quieto: se escala alrededor de él.
      const cx = vista.x0 + (px / tamano.ancho) * (vista.x1 - vista.x0);
      const cy = vista.y0 + ((tamano.alto - py) / tamano.alto) * (vista.y1 - vista.y0);

      const fx = soloY ? 1 : factor;
      const fy = soloX ? 1 : factor;

      onVista({
        x0: cx + (vista.x0 - cx) * fx,
        x1: cx + (vista.x1 - cx) * fx,
        y0: cy + (vista.y0 - cy) * fy,
        y1: cy + (vista.y1 - cy) * fy,
      });
    };

    elemento.addEventListener('wheel', alGirar, { passive: false });
    return () => elemento.removeEventListener('wheel', alGirar);
  }, [vista, tamano, onVista]);

  const alBajar = useCallback(
    (evento) => {
      const { px, py } = posicion(evento);
      arrastre.current = { px, py, vista };
      evento.currentTarget.setPointerCapture?.(evento.pointerId);
    },
    [vista],
  );

  const alMover = useCallback(
    (evento) => {
      const { px, py } = posicion(evento);
      setCursor({ px, py });

      const inicio = arrastre.current;
      if (!inicio) return;

      const porPixelX = (inicio.vista.x1 - inicio.vista.x0) / tamano.ancho;
      const porPixelY = (inicio.vista.y1 - inicio.vista.y0) / tamano.alto;
      const dx = (px - inicio.px) * porPixelX;
      const dy = (py - inicio.py) * porPixelY;

      onVista({
        x0: inicio.vista.x0 - dx,
        x1: inicio.vista.x1 - dx,
        y0: inicio.vista.y0 + dy,
        y1: inicio.vista.y1 + dy,
      });
    },
    [tamano, onVista],
  );

  const alSoltar = useCallback(() => {
    arrastre.current = null;
  }, []);

  return (
    <>
      <div className="bloque-cabeza">
        <h2>Gráfica</h2>
        <div className="bloque-acciones">
          <span className="pista">arrastra para mover · rueda para zoom · doble clic para encuadrar</span>
          <button type="button" className="boton boton-secundario" onClick={onEncuadrar}>
            Encuadrar
          </button>
        </div>
      </div>

      <div className="lienzo-caja" ref={contenedor}>
        <canvas
          ref={lienzo}
          className="lienzo"
          role="img"
          aria-label={`Gráfica de ${nombreFuncion}`}
          onPointerDown={alBajar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onPointerLeave={() => {
            alSoltar();
            setCursor(null);
          }}
          onDoubleClick={onEncuadrar}
        />
      </div>
    </>
  );
}
