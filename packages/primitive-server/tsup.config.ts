import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'esnext',
    outDir: 'dist',
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
});
