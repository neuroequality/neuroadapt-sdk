import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'node18',
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'accessibility/wcag-validator': resolve(__dirname, 'src/accessibility/wcag-validator.ts'),
        'e2e/neuroadapt-test-runner': resolve(__dirname, 'src/e2e/neuroadapt-test-runner.ts'),
        'playwright/accessibility': resolve(__dirname, 'src/playwright/accessibility.ts'),
        'utils/mock-adapters': resolve(__dirname, 'src/utils/mock-adapters.ts')
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: [
        'axe-core',
        '@playwright/test',
        '@testing-library/jest-dom',
        '@testing-library/react',
        '@testing-library/user-event',
        '@neuroadapt/core',
        '@neuroadapt/ai'
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        format: 'es'
      }
    },
    sourcemap: true,
    minify: false
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts']
  }
});