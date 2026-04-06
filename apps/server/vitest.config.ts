import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
        pool: 'forks',
        poolOptions: {
            forks: { singleFork: true },
        },
        testTimeout: 60_000,
        hookTimeout: 60_000,
    },
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, 'src'),
        },
        conditions: ['node'],
    },
});
