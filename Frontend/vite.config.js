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
        return deps.filter((dep) => dep.includes('vendor-react'));
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ۱. پکیج سنگین reconciler به چانک اختصاصی منتقل شود تا در لندینگ دانلود نشود
          if (id.includes('/react-reconciler/')) {
            return 'vendor-reconciler';
          }

          // ۲. هسته سبک React صرفاً شامل پکیج‌های حداقلی مورد نیاز صفحه نخست
          if (
              id.includes('commonjsHelpers') ||
              id.includes('vite/preload-helper') ||
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }

          if (!id.includes('node_modules')) return;

          // ۳. موتور سه‌بعدی کاملاً ایزوله
          if (
              id.includes('node_modules/three') ||
              id.includes('node_modules/@react-three') ||
              id.includes('node_modules/@dimforge')
          ) {
            return 'vendor-three';
          }

          // ۴. موتور کانواس دوبعدی کاملاً ایزوله
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

          if (id.includes('node_modules/zustand')) {
            return 'vendor-zustand';
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