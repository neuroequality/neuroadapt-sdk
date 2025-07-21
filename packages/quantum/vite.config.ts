import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'NeuroAdaptQuantum',
      fileName: (format) => `index.${format}.js`,
      formats: ['es']
    },
    rollupOptions: {
      external: ['three', '@neuroadapt/core', 'eventemitter3'],
      output: {
        globals: {
          'three': 'THREE',
          '@neuroadapt/core': 'NeuroAdaptCore',
          'eventemitter3': 'EventEmitter3'
        }
      }
    },
    target: 'esnext',
    minify: false,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});