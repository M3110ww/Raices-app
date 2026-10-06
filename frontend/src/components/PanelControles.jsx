import CampoFuncion from './CampoFuncion.jsx';
import Ejemplos from './Ejemplos.jsx';
import RaizDeNumero from './RaizDeNumero.jsx';
import SelectorMetodo from './SelectorMetodo.jsx';
import ValoresIniciales from './ValoresIniciales.jsx';
import CriterioParada from './CriterioParada.jsx';
import SelectorMotor from './SelectorMotor.jsx';

/** Panel lateral con todo lo que se puede configurar antes de calcular. */
export default function PanelControles({
  datos,
  actualizar,
  metodo,
  errorFuncion,
  errorG,
  derivadaAuto,
  avisoDerivada,
  motor,
  onMotor,
  estadoServidor,
  onReintentar,
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
          ayuda="Se admiten 2x, 3(x+1), x^2, x**2, sen, cos, tan, ln, log(x, base), sqrt, cbrt, abs, pi y e."
        />

        <Ejemplos actual={datos.funcion} onElegir={actualizar} />

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

        <SelectorMotor
          motor={motor}
          onMotor={onMotor}
          estado={estadoServidor}
          onReintentar={onReintentar}
        />

        <button type="submit" className="boton boton-principal" disabled={!puedeCalcular}>
          {calculando ? 'Calculando…' : 'Calcular raíz'}
        </button>
      </form>
    </aside>
  );
}
