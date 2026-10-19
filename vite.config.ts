import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, './src'),
      },
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    },
    server: {
      // HMR is disabled in AI Studio to prevent WebSocket transport errors.
      hmr: false,
      watch: null,
    },
  };
});
