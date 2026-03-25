import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['server/server.ts'],
    format: ['esm'],
    target: 'esnext',
    outDir: 'dist',
    dts: false,
    clean: true,
    sourcemap: true,
    treeshake: true,
    external: ['vite', /entry\.server/],
    //* Без этого не работает tree-shaking
    env: {
        NODE_ENV: 'production',
    },
});
