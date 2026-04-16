import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { entryScriptRewritePlugin } from './vite/plugins/entryScriptRewritePlugin';

export default defineConfig(({ command }) => ({
    plugins: [react(), entryScriptRewritePlugin()],

    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, 'src'),
        },
    },

    css: {
        modules: {
            generateScopedName:
                command === 'serve'
                    ? '[name]__[local]--[hash:base64:5]'
                    : '[hash:base64:8]',
        },
    },

    build: {
        outDir: 'dist/client',
    },
}));
