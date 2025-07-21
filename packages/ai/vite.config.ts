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
        'prediction/index': resolve(__dirname, 'src/prediction/index.ts'),
        'analytics/index': resolve(__dirname, 'src/analytics/index.ts'),
        'providers/index': resolve(__dirname, 'src/providers/index.ts'),
        'streaming/index': resolve(__dirname, 'src/streaming/index.ts'),
      },
      name: 'NeuroAdaptAI',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        '@neuroadapt/core',
        'eventemitter3',
        'zod',
        'openai',
        'anthropic',
      ],
      output: {
        globals: {
          '@neuroadapt/core': 'NeuroAdaptCore',
          'eventemitter3': 'EventEmitter3',
          'zod': 'Zod',
          'openai': 'OpenAI',
          'anthropic': 'Anthropic',
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80,
      },
    },
  },
});