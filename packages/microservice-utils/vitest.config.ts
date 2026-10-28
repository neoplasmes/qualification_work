import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts', 'src/**/*.test.int.ts'],
        pool: 'forks',
        testTimeout: 10_000,
    },
});
