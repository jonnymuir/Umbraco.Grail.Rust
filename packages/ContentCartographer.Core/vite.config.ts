import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: 'wwwroot',
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'ContentCartographer',
      formats: ['es', 'umd'],
      fileName: (format) => `cartographer.${format}.js`,
    },
    rollupOptions: {
      external: ['lit', 'three', '/wasm/grail_core.js'],
      output: {
        globals: {
          lit: 'lit',
          three: 'THREE',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
