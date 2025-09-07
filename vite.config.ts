import path from 'path';
import { defineConfig, loadEnv } from 'vite';
/// <reference types="vitest" />

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      envPrefix: ['VITE_', 'SUPABASE_', 'GEMINI_'],
      
      // Performance optimizations
      build: {
        target: 'es2020',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor': ['react', 'react-dom'],
              'framer-motion': ['framer-motion'],
              'icons': ['@heroicons/react/24/solid', '@heroicons/react/24/outline'],
              'fabric': ['fabric'],
            },
          },
        },
        chunkSizeWarningLimit: 1000,
      },
      
      // Development optimizations
      server: {
        hmr: {
          overlay: false,
        },
      },
      
      optimizeDeps: {
        include: ['react', 'react-dom', 'framer-motion', 'fabric'],
        exclude: ['fabric/node'],
      },
      
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
      },
    };
});
