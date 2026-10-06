import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    // mathjs se carga con import() dinámico y sale en su propio trozo: solo se
    // descarga al elegir Newton, así que su tamaño no afecta al arranque.
    chunkSizeWarningLimit: 900,
  },
  // Las pruebas solo ejercitan la lógica pura de src/lib, así que no hace falta
  // un DOM simulado.
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
