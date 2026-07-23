import { createDependencies } from '@/main/dependencies';
import { afterEach, expect, it, vi } from 'vitest';

import { createAppSnapshot, hydrateAppSnapshot, observeDeferredReads } from './hydration';

const runtimes: ReturnType<typeof createDependencies>[] = [];
afterEach(async () => {
    await Promise.all(runtimes.map(runtime => runtime.dispose()));
    vi.unstubAllGlobals();
});
it('hydrates entities before publishing query refs and rejects retired scopes', async () => {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async () =>
            Response.json({
                id: 'u',
                email: 'a@b.com',
                name: 'A',
                family: 'B',
                isInitializing: false,
                organizations: [],
            })
        )
    );
    const a = createDependencies({ platform: 'server', apiBaseUrl: '/api' });
    const b = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });
    runtimes.push(a, b);
    await a.cache.read(a.dependencies.getSession, undefined);
    const snapshot = createAppSnapshot(a.cache, a.scopeId);
    b.acceptScope(snapshot.scopeId);
    const stop = b.cache.queryClient.getQueryCache().subscribe(event => {
        if (event.query.state.data) {
            expect(b.cache.store.get('user:u')?.id).toBe('u');
        }
    });
    expect(await hydrateAppSnapshot(b.cache, snapshot, () => b.scopeId)).toBe(true);
    stop();
    await b.dependencies.session.reset();
    expect(await hydrateAppSnapshot(b.cache, snapshot, () => b.scopeId)).toBe(false);
    expect([...b.cache.store.keys()]).toEqual([]);
});
it('observes deferred rejection without an unhandled derived promise', async () => {
    const runtime = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });
    runtimes.push(runtime);
    const errors = vi.fn();
    const rejected = Promise.reject(new Error('loader failed'));
    await observeDeferredReads(
        { route: { deferred: rejected } },
        runtime.cache,
        () => runtime.scopeId,
        errors
    );
    await vi.waitFor(() => expect(errors).toHaveBeenCalledOnce());
});

it('excludes paused upload inputs and browser resources from snapshots', () => {
    const runtime = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });
    runtimes.push(runtime);
    const files = runtime.dependencies.uploads.register([
        new File(['private bytes'], 'private.csv'),
    ]);
    runtime.cache.queryClient.getMutationCache().build(
        runtime.cache.queryClient,
        {},
        {
            context: undefined,
            data: undefined,
            error: null,
            failureCount: 0,
            failureReason: null,
            isPaused: true,
            status: 'pending',
            variables: { orgId: 'org', files },
            submittedAt: 1,
        }
    );
    const snapshot = createAppSnapshot(runtime.cache, runtime.scopeId);
    expect(snapshot.queries.mutations).toEqual([]);
    expect(JSON.stringify(snapshot)).not.toContain('private.csv');
    runtime.dependencies.uploads.release(files);
});
