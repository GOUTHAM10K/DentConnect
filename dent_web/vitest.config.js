import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/vitest.setup.js',
    globals: true,
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['tests/**', 'node_modules/**', 'dist/**'],
    coverage: {
      reporter: ['text', 'json-summary', 'html'],
      exclude: ['src/main.jsx', 'src/test/**'],
    },
  },
});
