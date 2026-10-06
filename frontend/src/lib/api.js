/**
 * Puente con la API Java, con respaldo en el motor del navegador.
 *
 * Si VITE_API_URL no está configurada, todo se calcula aquí mismo. Si está pero
 * el servidor no responde (el plan gratuito de Render apaga el servicio cuando
 * nadie lo usa), se calcula en el navegador y se avisa, en lugar de dejar a la
 * persona mirando un error.
 */

import { resolverLocal } from './metodos.js';

/** URL de la API. Vacía significa "trabajar solo en el navegador". */
export const API_URL = (import.meta.env?.VITE_API_URL ?? '').replace(/\/+$/, '');

/** True si hay un servidor configurado al que preguntar. */
export function hayServidor() {
  return API_URL !== '';
}

/**
 * Comprueba que el servidor esté despierto.
 *
 * El tiempo de espera es generoso a propósito: un servicio dormido en Render
 * tarda hasta un minuto en arrancar.
 */
export async function servidorDisponible(timeoutMs = 60000) {
  if (!hayServidor()) return false;
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), timeoutMs);
  try {
    const respuesta = await fetch(`${API_URL}/api/salud`, { signal: corte.signal });
    if (!respuesta.ok) return false;
    const datos = await respuesta.json();
    return datos?.estado === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(reloj);
  }
}

/** Pide al servidor el catálogo de métodos. Devuelve null si no se puede. */
export async function metodosDelServidor(timeoutMs = 60000) {
  if (!hayServidor()) return null;
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), timeoutMs);
  try {
    const respuesta = await fetch(`${API_URL}/api/metodos`, { signal: corte.signal });
    if (!respuesta.ok) return null;
    return await respuesta.json();
  } catch {
    return null;
  } finally {
    clearTimeout(reloj);
  }
}

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
 * @param {'java'|'navegador'} motor dónde se quiere calcular
 * @returns {Promise<{resultado: object, aviso: string|null}>}
 * @throws {ErrorApi} si el servidor rechaza la petición (400), porque entonces
 *   el motor local la rechazaría igual y el mensaje ya es el correcto
 */
export async function resolver(solicitud, motor = 'java') {
  if (motor !== 'java' || !hayServidor()) {
    return { resultado: resolverLocal(solicitud), aviso: null };
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/api/raices/resolver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(solicitud),
    });
  } catch {
    // Error de red: se recalcula aquí y se avisa.
    return {
      resultado: resolverLocal(solicitud),
      aviso: 'El servidor Java no respondió; se calculó en el navegador',
    };
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

  if (!respuesta.ok) {
    return {
      resultado: resolverLocal(solicitud),
      aviso: `El servidor Java falló (${respuesta.status}); se calculó en el navegador`,
    };
  }

  try {
    return { resultado: await respuesta.json(), aviso: null };
  } catch {
    return {
      resultado: resolverLocal(solicitud),
      aviso: 'El servidor Java no respondió; se calculó en el navegador',
    };
  }
}
