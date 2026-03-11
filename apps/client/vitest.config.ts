import path from 'path';
import { defineConfig } from 'vitest/config';
import reactswc from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [reactswc()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
