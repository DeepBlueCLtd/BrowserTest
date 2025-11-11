import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SonarQuiz',
      formats: ['iife', 'es'],
      fileName: (format) => {
        if (format === 'iife') return 'sonar-quiz.iife.js';
        if (format === 'es') return 'sonar-quiz.esm.js';
        return `sonar-quiz.${format}.js`;
      },
    },
    rollupOptions: {
      output: {
        // Ensure clean global name for IIFE
        name: 'SonarQuiz',
        // Preserve exports for ESM
        exports: 'named',
      },
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: true,
      },
      mangle: {
        keep_classnames: true, // Preserve class names for custom elements
      },
    },
    target: 'es2022',
  },
  optimizeDeps: {
    include: ['lit'],
  },
  server: {
    port: 3000,
    open: true,
  },
});
