import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as { version: string };

export default defineConfig(({ command, mode }) => {
  // Only enable dts plugin for library builds (not Storybook)
  // Storybook sets mode to 'production' but doesn't define build.lib
  const isLibraryBuild = command === 'build' && !process.env.STORYBOOK;

  // Generate build date at build time in DD/Mon/YYYY format
  const now = new Date();
  const day = now.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const buildDate = `${day}/${months[now.getMonth()]}/${now.getFullYear()}`;

  // Read ENCRYPT_STORAGE from environment (default: false)
  const encryptStorage = process.env.ENCRYPT_STORAGE === 'true';

  return {
    define: {
      __BUILD_DATE__: JSON.stringify(buildDate),
      __APP_VERSION__: JSON.stringify(pkg.version),
      __ENCRYPT_STORAGE__: JSON.stringify(encryptStorage),
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
