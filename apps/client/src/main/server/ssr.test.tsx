import {
    createAppSnapshot,
    hydrateAppSnapshot,
    serializeSnapshot,
} from '@/env/cache/hydration';
import { afterEach, expect, it, vi } from 'vitest';

import { createDependencies } from '../dependencies';

const runtimes: ReturnType<typeof createDependencies>[] = [];
afterEach(async () => {
    await Promise.all(runtimes.map(runtime => runtime.dispose()));
    vi.unstubAllGlobals();
});

it('isolates requests and restores canonical session without another read', async () => {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementation(async (_url, init) =>
            Response.json({
                id: new Headers(init?.headers).get('cookie') ?? 'browser',
                email: 'a@example.com',
                name: '</script><script>bad()</script>',
                family: 'B',
                isInitializing: false,
                organizations: [{ id: 'org/1', name: 'Workspace', role: 'owner' }],
            })
        );
    vi.stubGlobal('fetch', fetch);
    vi.stubGlobal('window', undefined);
    const a = createDependencies({
        platform: 'server',
        apiBaseUrl: 'http://api',
        requestCookie: 'a',
    });
    const b = createDependencies({
        platform: 'server',
        apiBaseUrl: 'http://api',
        requestCookie: 'b',
    });
    runtimes.push(a, b);
    const [first, second] = await Promise.all([
        a.cache.read(a.dependencies.getSession, undefined),
        b.cache.read(b.dependencies.getSession, undefined),
    ]);
    expect(a.cache).not.toBe(b.cache);
    expect(a.legacyStore).not.toBe(b.legacyStore);
    expect(first.user.id).toBe('a');
    expect(second.user.id).toBe('b');
    const snapshot = createAppSnapshot(a.cache, a.scopeId);
    expect(serializeSnapshot(snapshot)).not.toContain('</script>');
    const browser = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });
    runtimes.push(browser);
    browser.acceptScope(snapshot.scopeId);
    await hydrateAppSnapshot(browser.cache, snapshot, () => browser.scopeId);
    expect(await browser.cache.read(browser.dependencies.getSession, undefined)).toEqual(
        first
    );
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(browser.cache.store.get('organization:org%2F1')?.id).toBe('org/1');
});

it('aborts the shared fetch on request disconnect', async () => {
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
    const controller = new AbortController();
    const runtime = createDependencies({
        platform: 'server',
        apiBaseUrl: 'http://api',
        requestSignal: controller.signal,
    });
    runtimes.push(runtime);
    const read = runtime.cache.read(runtime.dependencies.getSession, undefined);
    const rejected = expect(read).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(signal).toBeDefined());
    controller.abort();
    await rejected;
    expect(signal?.aborted).toBe(true);
});
