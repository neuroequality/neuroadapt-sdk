import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        cli: resolve(__dirname, 'src/cli.ts')
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: [
        // Node.js built-ins
        'fs',
        'path',
        'url',
        'util',
        'os',
        'child_process',
        'events',
        'stream',
        // Dependencies
        'commander',
        'chalk',
        'inquirer',
        'ora',
        'fs-extra',
        // Internal packages
        '@neuroadapt/core',
        '@neuroadapt/quantum',
        '@neuroadapt/vr'
      ],
      output: {
        globals: {
          'commander': 'commander',
          'chalk': 'chalk',
          'inquirer': 'inquirer',
          'ora': 'ora',
          'fs-extra': 'fs-extra'
        }
      }
    },
    target: 'node18',
    minify: false
  },
  define: {
    'import.meta.vitest': 'undefined'
  }
});