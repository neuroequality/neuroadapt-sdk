import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'react-native': resolve(__dirname, 'src/react-native/index.ts'),
        adapters: resolve(__dirname, 'src/adapters/index.ts'),
        gestures: resolve(__dirname, 'src/gestures/index.ts'),
        testing: resolve(__dirname, 'src/testing/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-native',
        '@neuroadapt/core',
      ],
    },
    target: 'es2020',
    minify: 'terser',
  },
  esbuild: {
    target: 'es2020',
  },
}); 