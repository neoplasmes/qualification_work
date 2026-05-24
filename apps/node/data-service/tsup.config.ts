import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'esnext',
    outDir: 'dist',
    dts: false,
    clean: true,
    sourcemap: true,
    treeshake: true,
    // workspace-пакеты экспортируют .ts напрямую — бандлим их внутрь dist
    noExternal: [
        /^@qualification-work\/microservice-utils/,
        /^@qualification-work\/redis-cache/,
    ],
});
