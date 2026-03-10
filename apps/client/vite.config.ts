import path from 'path';
import { defineConfig } from 'vite';
// SWC - более быстрый? чем Babel, транспайлер, написанный на Rust.
import reactswc from '@vitejs/plugin-react-swc';

export default defineConfig({
    plugins: [reactswc()],
    resolve: {
        alias: {
            '@': path.resolve(process.cwd(), 'src'),
        },
    },
});
