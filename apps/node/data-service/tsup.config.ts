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
    noExternal: [/^@qualification-work\/microservice-utils/],
});
