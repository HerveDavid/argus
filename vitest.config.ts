import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: '././src-react/testing/setup-tests.ts',
    mockReset: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '././src-react'),
    },
  },
});
