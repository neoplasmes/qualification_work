import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tools/**/*.test.int.ts'],
        exclude: ['**/node_modules/**'],
        testTimeout: 20_000,
    },
});
