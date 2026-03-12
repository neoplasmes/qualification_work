import path from 'path';
import { defineConfig } from 'vite';
// SWC - более быстрый, чем Babel, транспайлер, написанный на Rust.
import reactswc from '@vitejs/plugin-react-swc';

export default defineConfig({
    plugins: [reactswc()],
    resolve: {
        alias: {
            '@': path.resolve(process.cwd(), 'src'),
        },
    },
    server: {
        proxy: {
            // localhost:5137/api/path => localhost:4000/path
            // rewrite как раз затирает '/api'
            '/api': {
                target: 'http://localhost:4000',
                rewrite: path => path.replace(/^\/api/, ''),
            },
        },
    },
    build: {
        // Явно указал, чтобы запомнить
        outDir: 'dist',
    },
});
