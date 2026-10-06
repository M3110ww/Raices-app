import CampoFuncion from './CampoFuncion.jsx';
import RaizDeNumero from './RaizDeNumero.jsx';
import SelectorMetodo from './SelectorMetodo.jsx';
import ValoresIniciales from './ValoresIniciales.jsx';
import CriterioParada from './CriterioParada.jsx';

/** Panel lateral con todo lo que se puede configurar antes de calcular. */
export default function PanelControles({
  datos,
  actualizar,
  metodo,
  errorFuncion,
  errorG,
  derivadaAuto,
  avisoDerivada,
  onBuscarCambioDeSigno,
  onCalcular,
  calculando,
  puedeCalcular,
}) {
  return (
    <aside className="panel" aria-label="Datos del problema">
      <form
        className="panel-cuerpo"
        onSubmit={(e) => {
          e.preventDefault();
          if (puedeCalcular) onCalcular();
        }}
      >
        <CampoFuncion
          id="campo-f"
          etiqueta="f(x) ="
          valor={datos.funcion}
          onCambiar={(valor) => actualizar({ funcion: valor })}
          error={errorFuncion}
          placeholder="x^3 - x - 2"
          ayuda="sen, cos, tan, ln, log, sqrt, cbrt, abs, pi, e. Vale 2x y x**2."
        />

        <RaizDeNumero onAplicar={actualizar} />

        <SelectorMetodo valor={datos.metodo} onCambiar={(id) => actualizar({ metodo: id })} />

        <ValoresIniciales
          datos={datos}
          actualizar={actualizar}
          metodo={metodo}
          errorG={errorG}
          derivadaAuto={derivadaAuto}
          avisoDerivada={avisoDerivada}
          onBuscarCambioDeSigno={onBuscarCambioDeSigno}
        />

        <CriterioParada datos={datos} actualizar={actualizar} />

        <button type="submit" className="boton boton-principal" disabled={!puedeCalcular}>
          {calculando ? 'Calculando…' : 'Calcular raíz'}
        </button>
      </form>
    </aside>
  );
}
