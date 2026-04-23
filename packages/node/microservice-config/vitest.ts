import { defineConfig } from 'vitest/config';

export function createVitestConfig(srcDir: string) {
    return defineConfig({
        test: {
            environment: 'node',
            include: ['src/**/*.test.ts'],
            pool: 'forks',
            fileParallelism: false,
            testTimeout: 60_000,
            hookTimeout: 60_000,
        },
        resolve: {
            alias: { '@': srcDir },
            conditions: ['node'],
        },
    });
}
