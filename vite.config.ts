import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
  // Only enable dts plugin for library builds (not Storybook)
  // Storybook sets mode to 'production' but doesn't define build.lib
  const isLibraryBuild = command === 'build' && !process.env.STORYBOOK;

  // Generate build date at build time
  const buildDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  return {
    define: {
      __BUILD_DATE__: JSON.stringify(buildDate),
      // Security configuration from environment variables
      'import.meta.env.VITE_INSTRUCTOR_PASSWORD_HASH': JSON.stringify(
        process.env.VITE_INSTRUCTOR_PASSWORD_HASH || ''
      ),
      'import.meta.env.VITE_ENABLE_ENCRYPTION': JSON.stringify(
        process.env.VITE_ENABLE_ENCRYPTION !== 'false'
      ),
      'import.meta.env.VITE_ENABLE_RATE_LIMIT': JSON.stringify(
        process.env.VITE_ENABLE_RATE_LIMIT !== 'false'
      ),
      'import.meta.env.VITE_ENABLE_SECURITY_LOGS': JSON.stringify(
        process.env.VITE_ENABLE_SECURITY_LOGS === 'true'
      ),
    },
    plugins: [
      // Only generate declaration files during library build, not Storybook
      ...(isLibraryBuild
        ? [
            dts({
              insertTypesEntry: true,
              rollupTypes: true,
            }),
          ]
        : []),
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
  };
});
