import { createStaticHandler } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';

import { createDependencies } from '../dependencies';
import { getRoutes } from './routes';

const runtimes: ReturnType<typeof createDependencies>[] = [];
afterEach(async () => {
    await Promise.all(runtimes.map(runtime => runtime.dispose()));
    vi.unstubAllGlobals();
});
it('keeps anonymous redirects and handles entrance 401 once', async () => {
    const fetch = vi
        .fn()
        .mockImplementation(async () => new Response('', { status: 401 }));
    vi.stubGlobal('fetch', fetch);
    const runtime = createDependencies({ platform: 'server', apiBaseUrl: 'http://api' });
    runtimes.push(runtime);
    const handler = createStaticHandler(getRoutes(runtime));
    const result = await handler.query(new Request('http://localhost/datasets'));
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('location')).toBe('/sign-in');
    const entrance = await handler.query(new Request('http://localhost/sign-in'));
    expect(entrance).not.toBeInstanceOf(Response);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(runtime.cache.epoch).toBe(0);
});
it('redirects authenticated entrance pages and preserves protected workspace URLs', async () => {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async () =>
            Response.json({
                id: 'u',
                email: 'a@b.com',
                name: 'A',
                family: 'B',
                isInitializing: true,
                organizations: [],
            })
        )
    );
    const runtime = createDependencies({ platform: 'server', apiBaseUrl: 'http://api' });
    runtimes.push(runtime);
    const handler = createStaticHandler(getRoutes(runtime));
    const result = await handler.query(new Request('http://localhost/sign-up'));
    expect((result as Response).headers.get('location')).toBe('/datasets');
    for (const path of [
        '/actions/view?id=a',
        '/charts/edit?id=c',
        '/dashboards',
        '/profile',
    ]) {
        const protectedResult = await handler.query(
            new Request(`http://localhost${path}`)
        );
        expect(protectedResult).not.toBeInstanceOf(Response);
    }
});

it('keeps local logout on entrance even when the server cookie survived', async () => {
    const fetch = vi.fn().mockImplementation(async () =>
        Response.json({
            id: 'u',
            email: 'a@b.com',
            name: 'A',
            family: 'B',
            isInitializing: false,
            organizations: [],
        })
    );
    vi.stubGlobal('fetch', fetch);
    const runtime = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });
    runtimes.push(runtime);
    await runtime.cache.read(runtime.dependencies.getSession, undefined);
    await runtime.dependencies.session.reset();
    const result = await createStaticHandler(getRoutes(runtime)).query(
        new Request('http://localhost/sign-in')
    );
    expect(result).not.toBeInstanceOf(Response);
    expect(fetch).toHaveBeenCalledTimes(1);
});
