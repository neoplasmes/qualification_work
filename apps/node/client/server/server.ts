import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';
import { Application } from 'primitive-server';

import type { StreamSSRFn } from '../src/entry.server';
import { serveStatic } from './serveStatic';

const isDev = process.env.NODE_ENV !== 'production';
const isPreview = process.env.PREVIEW === 'true';

if (isDev && !process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

const port = Number(process.env.PORT);
assert(Boolean(port), 'PORT env variable is specified incorrectly');

const rootDir = path.join(import.meta.dirname, '..');
const distDir = path.join(rootDir, 'dist');

const ssrOutlet = '<!--ssr-outlet-->';
const renderErrorHtml = readFileSync(
    path.join(import.meta.dirname, 'renderError.html'),
    'utf-8'
);

const server = new Application();

if (isDev) {
    //* Development instance
    const { createServer } = await import('vite');

    const vite = await createServer({
        server: {
            middlewareMode: true,
        },
        appType: 'custom',
    });

    server.onRequest(ctx => {
        /**
         * Оборачиваем в Promise потому, что vite middlewares у себя внутри отрабатывают асинхронно, несмотря на синхронные возварт void
         * Это может несостыковываться с lifecycle primitive-server'а, поэтому вместо вот этого убого next(), который vite требует для соответствия с
         * connect архитектурой middleware'ов, мы прокидываем резолв промиса. Тогда primitive-server спокойно сможет await'нуть мидлвары vite'а
         */
        return new Promise(resolve => {
            vite.middlewares(ctx.request, ctx.response, () => resolve());
        });
    });

    server.onReady(() => {
        console.log(`\nSSR server running at http://localhost:${port}\n`);
    });

    const template = readFileSync(path.join(rootDir, 'index.html'), 'utf-8');

    server.get('*', async ctx => {
        const { request, response } = ctx;
        const url = request.URL;

        const html = await vite.transformIndexHtml(url, template);
        const splitted = html.split(ssrOutlet);
        assert(
            splitted.length === 2,
            'FATAL ERROR: MORE OR LESS THAN 1 SSR OUTLETS HAVE BEEN DETECTED'
        );

        const htmlBefore = splitted[0];
        const htmlAfter = splitted[1];

        /**
         * Vite резолвит все модули относительно корня проекта, вне зависимости от местонахождения сервера
         */
        const ssrModule = await vite.ssrLoadModule('/src/entry.server.tsx');
        const render: StreamSSRFn = ssrModule.streamSSR;
        assert(
            typeof render === 'function',
            'FATAL ERROR DURING STREAMSSR FUNCTION IMPORT'
        );

        await render(request, response, htmlBefore, htmlAfter, renderErrorHtml);
    });
} else {
    //* Production instance
    if (isPreview) {
        server.onRequest(async ctx => {
            const { request, response } = ctx;
            if (!request.pathname.startsWith('/api/')) {return;}
            await new Promise<void>((resolve, reject) => {
                const proxyReq = http.request(
                    {
                        hostname: 'localhost',
                        port: 8080,
                        path: request.URL,
                        method: request.method,
                        headers: request.headers,
                    },
                    proxyRes => {
                        response.statusCode = proxyRes.statusCode ?? 502;
                        for (const [key, val] of Object.entries(proxyRes.headers)) {
                            if (val !== undefined)
                                {response.setHeader(key, val as string | string[]);}
                        }
                        pipeline(proxyRes, response).then(resolve).catch(reject);
                    }
                );
                proxyReq.on('error', reject);
                request.pipe(proxyReq);
            });
        });
    }

    const assetsDir = path.join(distDir, 'client');
    const serverBundlePath = path.join(distDir, 'server', 'entry.server.js');

    server.get('/assets/*', serveStatic(assetsDir, '/'));

    const prodHTML = readFileSync(path.join(distDir, 'client', 'index.html'), 'utf-8');
    const splitted = prodHTML.split(ssrOutlet);
    assert(
        splitted.length === 2,
        'FATAL ERROR: MORE OR LESS THAN 1 SSR OUTLETS HAVE BEEN DETECTED'
    );
    const htmlBefore = splitted[0];
    const htmlAfter = splitted[1];

    const streamSSR = await import(pathToFileURL(serverBundlePath).href).then(
        module => module.streamSSR
    );
    assert(
        typeof streamSSR === 'function',
        'FATAL ERROR DURING STREAMSSR FUNCTION IMPORT'
    );

    server.onReady(() => {
        console.log(`\nSSR server running at http://localhost:${port}\n`);
    });

    server.get('*', async ctx => {
        const { request, response } = ctx;
        await streamSSR(request, response, htmlBefore, htmlAfter, renderErrorHtml);
    });
}

server.listen({ port, host: '0.0.0.0' });
