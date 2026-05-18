import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { entryScriptRewritePlugin } from './vite/plugins/entryScriptRewritePlugin';

const hmrClientPort = Number(process.env.VITE_HMR_CLIENT_PORT);
const hmr =
    process.env.VITE_HMR_HOST || process.env.VITE_HMR_PROTOCOL || hmrClientPort
        ? {
              protocol: process.env.VITE_HMR_PROTOCOL as 'ws' | 'wss' | undefined,
              host: process.env.VITE_HMR_HOST,
              clientPort: Number.isFinite(hmrClientPort)
                  ? hmrClientPort
                  : undefined,
          }
        : undefined;

export default defineConfig(({ command }) => ({
    plugins: [react(), entryScriptRewritePlugin()],

    server: {
        hmr,
    },

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
