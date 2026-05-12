import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['scenarios/**/*.test.ts'],
        globalSetup: ['./setup.ts'],
        testTimeout: 60_000,
        hookTimeout: 15_000,
        fileParallelism: false,
        pool: 'forks',
    },
});
