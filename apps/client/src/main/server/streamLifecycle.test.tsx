// @vitest-environment node
import { get, type Server } from 'node:http';
import { Application } from 'primitive-server';
import { afterEach, expect, it, vi } from 'vitest';

import type { ApplicationRuntime } from '../dependencies';
import { streamSSR } from './entry.server';

const state = vi.hoisted(() => ({
    runtimes: [] as ApplicationRuntime[],
    deferred: undefined as Promise<unknown> | undefined,
}));
vi.mock('../router', () => ({
    getRoutes: (runtime: ApplicationRuntime) => {
        state.runtimes.push(runtime);

        return [
            {
                path: '/',
                element: <div>stream shell</div>,
                loader: async () => {
                    await runtime.cache.read(runtime.dependencies.getSession, undefined);

                    return { later: state.deferred };
                },
            },
        ];
    },
}));
let server: Server | undefined;
afterEach(async () => {
    server?.closeAllConnections();
    if (server) {
        await new Promise<void>(resolve => server!.close(() => resolve()));
    }
    server = undefined;
    await Promise.all(state.runtimes.splice(0).map(runtime => runtime.dispose()));
    vi.unstubAllGlobals();
});

it('keeps runtime until deferred output and the real response finish', async () => {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async () =>
            Response.json({
                id: 'u',
                email: 'a@b.com',
                name: '</script><script>bad()</script>',
                family: 'B',
                isInitializing: false,
                organizations: [],
            })
        )
    );
    let resolveDeferred!: (value: unknown) => void;
    state.deferred = new Promise(resolve => {
        resolveDeferred = resolve;
    });
    let settled = false;
    let render!: Promise<unknown>;
    const application = new Application();
    application.get('/', ({ request, response }) => {
        render = streamSSR(
            request,
            response,
            '<html><div id="root">',
            '</div></html>',
            'failed'
        ).then(() => {
            settled = true;
        });
    });
    server = await application.listen({ port: 0, host: '127.0.0.1' });
    const address = server.address();
    if (!address || typeof address === 'string') {
        throw new Error('Missing server address');
    }
    let shell!: () => void;
    const arrived = new Promise<void>(resolve => {
        shell = resolve;
    });
    const body = new Promise<string>((resolve, reject) => {
        get(`http://127.0.0.1:${address.port}/`, response => {
            let html = '';
            response.on('data', chunk => {
                html += String(chunk);
                shell();
            });
            response.on('end', () => resolve(html));
            response.on('error', reject);
        }).on('error', reject);
    });
    await arrived;
    expect(settled).toBe(false);
    expect(state.runtimes[0]!.cache.store.get('user:u')?.id).toBe('u');
    resolveDeferred({ text: '</template><script>bad()</script>' });
    const html = await body;
    await render;
    expect(html).toContain('stream shell');
    expect(html).not.toContain('</script><script>bad()');
    expect(html).not.toContain('</template><script>bad()');
    expect(settled).toBe(true);
    expect(state.runtimes[0]!.cache.queryClient.getQueryCache().getAll()).toEqual([]);
});

it('disconnect aborts a loader fetch and settles the render', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
        'fetch',
        vi.fn(
            (_url, init) =>
                new Promise((_resolve, reject) => {
                    signal = init.signal;
                    signal?.addEventListener('abort', () =>
                        reject(new DOMException('cancelled', 'AbortError'))
                    );
                })
        )
    );
    let render!: Promise<unknown>;
    const application = new Application();
    application.get('/', ({ request, response }) => {
        render = streamSSR(request, response, '<html>', '</html>', 'failed').catch(
            () => {}
        );
    });
    server = await application.listen({ port: 0, host: '127.0.0.1' });
    const address = server.address();
    if (!address || typeof address === 'string') {
        throw new Error('Missing server address');
    }
    const request = get(`http://127.0.0.1:${address.port}/`);
    request.on('error', () => {});
    await vi.waitFor(() => expect(signal).toBeDefined());
    request.destroy();
    await vi.waitFor(() => expect(signal?.aborted).toBe(true));
    await render;
    expect(state.runtimes[0]!.cache.queryClient.getQueryCache().getAll()).toEqual([]);
});
