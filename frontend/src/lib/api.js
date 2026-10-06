/**
 * Puente con la API Java, con respaldo en el motor del navegador.
 *
 * Los dos motores implementan el mismo algoritmo y devuelven los mismos
 * números, así que dónde se calcule no cambia el resultado y no es algo que
 * haya que preguntar ni anunciar. Si VITE_API_URL está configurada se pregunta
 * al servidor; si no lo está, o no responde, se calcula aquí mismo. El plan
 * gratuito de Render apaga el servicio cuando nadie lo usa, de modo que ese
 * respaldo entra en funcionamiento a menudo.
 */

import { resolverLocal } from './metodos.js';

/** URL de la API. Vacía significa "trabajar solo en el navegador". */
const API_URL = (import.meta.env?.VITE_API_URL ?? '').replace(/\/+$/, '');

/**
 * Error que trae un mensaje pensado para mostrarse tal cual.
 *
 * Lo usan los 400 del servidor: el backend ya devuelve el texto en español.
 */
export class ErrorApi extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

/**
 * Resuelve f(x) = 0.
 *
 * @param {object} solicitud cuerpo de la petición
 * @returns {Promise<object>} el resultado, venga del servidor o del navegador
 * @throws {ErrorApi} si el servidor rechaza la petición (400), porque entonces
 *   el motor local la rechazaría igual y el mensaje ya es el correcto
 */
export async function resolver(solicitud) {
  if (API_URL === '') return resolverLocal(solicitud);

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/api/raices/resolver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(solicitud),
    });
  } catch {
    // Error de red o servidor dormido: se recalcula aquí.
    return resolverLocal(solicitud);
  }

  if (respuesta.status === 400) {
    let mensaje = 'La petición no es válida';
    try {
      const datos = await respuesta.json();
      if (datos?.error) mensaje = datos.error;
    } catch {
      // Si el cuerpo no se puede leer, se queda el mensaje genérico.
    }
    throw new ErrorApi(mensaje);
  }

  if (!respuesta.ok) return resolverLocal(solicitud);

  try {
    return await respuesta.json();
  } catch {
    return resolverLocal(solicitud);
  }
}
