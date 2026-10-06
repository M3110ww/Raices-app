/** Alterna entre el tema "papel" (claro) y el "plano azul" (oscuro). */
export default function BotonTema({ tema, onCambiar }) {
  const esPlano = tema === 'plano';
  return (
    <button
      type="button"
      className="boton boton-tema"
      onClick={() => onCambiar(esPlano ? 'papel' : 'plano')}
      aria-label={esPlano ? 'Cambiar al tema papel' : 'Cambiar al tema plano azul'}
      title={esPlano ? 'Tema papel' : 'Tema plano azul'}
    >
      <span aria-hidden="true">{esPlano ? '□' : '■'}</span>
      {esPlano ? 'Papel' : 'Plano'}
    </button>
  );
}
