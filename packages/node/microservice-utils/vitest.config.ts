import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['internalAuth/**/*.test.ts', 'test/**/*.test.ts'],
        pool: 'forks',
        testTimeout: 10_000,
    },
});
