import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => ({
  define: {
    global: 'window',
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,
    modulePreload: {
      polyfill: false,
      resolveDependencies: (filename, deps) => {
        // فقط هسته سبک React به صورت موازی با index.js پیش‌بارگذاری شود
        return deps.filter((dep) => dep.includes('vendor-react'));
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
              id.includes('commonjsHelpers') ||
              id.includes('vite/preload-helper') ||
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/scheduler/') ||
              id.includes('/zustand/') ||
              id.includes('/its-fine/') ||
              id.includes('/react-reconciler/')
          ) {
            return 'vendor-react';
          }

          if (!id.includes('node_modules')) return;

          if (
              id.includes('node_modules/three') ||
              id.includes('node_modules/@react-three') ||
              id.includes('node_modules/@dimforge')
          ) {
            return 'vendor-three';
          }

          if (
              id.includes('node_modules/konva') ||
              id.includes('node_modules/react-konva')
          ) {
            return 'vendor-konva';
          }

          if (id.includes('node_modules/livekit-client')) {
            return 'vendor-livekit';
          }

          if (id.includes('node_modules/@stomp')) {
            return 'vendor-stomp';
          }
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  optimizeDeps: {
    include: [
      'konva',
      'react-konva',
      'livekit-client',
      '@stomp/stompjs',
      'zustand',
    ],
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://localhost:8080',
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
      },
    },
  },
}));