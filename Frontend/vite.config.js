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
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ۱. ماژول‌های مشترک Rollup و هسته React/Zustand حتماً اول بررسی شوند تا وارد vendor-three نشوند
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

          // ۲. موتور سه‌بعدی و فیزیک کاملاً ایزوله (فقط در زمان اسکرول یا ورود به اتاق دانلود می‌شود)
          if (
              id.includes('node_modules/three') ||
              id.includes('node_modules/@react-three') ||
              id.includes('node_modules/@dimforge')
          ) {
            return 'vendor-three';
          }

          // ۳. موتور کانواس دوبعدی (فقط در صفحه اتاق بازی دانلود می‌شود)
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