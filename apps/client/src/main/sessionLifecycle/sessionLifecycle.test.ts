import { useActiveOrganization, useSession } from '@/ui/session';
import { act, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import { ClientRoot } from '../ClientRoot';
import { createDependencies } from '../dependencies';

const runtimes: ReturnType<typeof createDependencies>[] = [];
afterEach(async () => {
    await Promise.all(runtimes.map(runtime => runtime.dispose()));
    localStorage.clear();
    vi.unstubAllGlobals();
});
it('clears session on failed logout and preserves panel layout', async () => {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async url => {
            if (String(url).endsWith('/auth/logout')) {
                throw new TypeError('offline');
            }

            return Response.json({
                id: 'u',
                email: 'a@b.com',
                name: 'A',
                family: 'B',
                isInitializing: false,
                organizations: [],
            });
        })
    );
    const runtime = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });
    runtimes.push(runtime);
    await runtime.cache.read(runtime.dependencies.getSession, undefined);
    localStorage.setItem('chartsPage_v1', 'secret');
    const navigate = vi.fn();
    runtime.dependencies.session.setNavigator(navigate);
    const scope = runtime.scopeId;
    await runtime.dependencies.session.logout();
    expect([...runtime.cache.store.keys()]).toEqual([]);
    expect(runtime.cache.queryClient.getQueryCache().getAll()).toEqual([]);
    expect(localStorage.getItem('chartsPage_v1')).toBeNull();
    expect(runtime.scopeId).not.toBe(scope);
    expect(navigate).toHaveBeenCalledWith('/sign-in');
});

it('ignores captured expiry callbacks from a retired session', async () => {
    let oldResponse!: (response: Response) => void;
    const me = {
        id: 'u',
        email: 'a@b.com',
        name: 'A',
        family: 'B',
        isInitializing: false,
        organizations: [],
    };
    const fetch = vi
        .fn()
        .mockImplementationOnce(async () => Response.json(me))
        .mockImplementationOnce(
            () =>
                new Promise<Response>(resolve => {
                    oldResponse = resolve;
                })
        )
        .mockImplementation(async () => Response.json({ ...me, id: 'new' }));
    vi.stubGlobal('fetch', fetch);
    const runtime = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });
    runtimes.push(runtime);
    await runtime.cache.read(runtime.dependencies.getSession, undefined);
    await runtime.cache.queryClient.invalidateQueries({ refetchType: 'none' });
    const old = runtime.cache.read(runtime.dependencies.getSession, undefined);
    const cancelled = expect(old).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(oldResponse).toBeDefined());
    await runtime.dependencies.session.reset();
    await cancelled;
    await runtime.cache.read(runtime.dependencies.getSession, undefined);
    const epoch = runtime.cache.epoch;
    oldResponse(new Response('', { status: 401 }));
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(runtime.cache.epoch).toBe(epoch);
    expect(runtime.cache.store.get('user:new')?.id).toBe('new');
});

it('polls fresh initialization results and cannot navigate after reset', async () => {
    const me = {
        id: 'u',
        email: 'a@b.com',
        name: 'A',
        family: 'B',
        isInitializing: true,
        organizations: [],
    };
    const fetch = vi
        .fn()
        .mockImplementationOnce(async () => Response.json(me))
        .mockImplementation(async () =>
            Response.json({
                ...me,
                isInitializing: false,
                organizations: [{ id: 'o', name: 'Org', role: 'owner' }],
            })
        );
    vi.stubGlobal('fetch', fetch);
    const runtime = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });
    runtimes.push(runtime);
    const navigate = vi.fn();
    runtime.dependencies.session.setNavigator(navigate);
    await runtime.dependencies.session.waitForWorkspace();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith('/datasets');
    navigate.mockClear();
    fetch.mockImplementation(async () => Response.json(me));
    const polling = runtime.dependencies.session.waitForWorkspace();
    const cancelled = expect(polling).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    await runtime.dependencies.session.reset();
    await cancelled;
    expect(navigate).not.toHaveBeenCalled();
});

it('does not navigate from expiration after a newer session transition', async () => {
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
    const runtime = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });
    runtimes.push(runtime);
    await runtime.cache.read(runtime.dependencies.getSession, undefined);
    const navigate = vi.fn();
    runtime.dependencies.session.setNavigator(navigate);
    const { SessionLifecycle } = await import('./sessionLifecycle');
    const lifecycle = runtime.dependencies.session;
    if (!(lifecycle instanceof SessionLifecycle)) {
        throw new Error('Missing session lifecycle');
    }
    const expired = lifecycle.expire();
    await lifecycle.reset();
    await expired;
    expect(navigate).not.toHaveBeenCalled();
});

it('clears selection after the selected organization is confirmed removed', async () => {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async (_url, init) =>
            init?.method === 'DELETE'
                ? new Response(null, { status: 204 })
                : Response.json({
                      id: 'u',
                      email: 'a@b.com',
                      name: 'A',
                      family: 'B',
                      isInitializing: false,
                      organizations: [{ id: 'o', name: 'Org', role: 'owner' }],
                  })
        )
    );
    const runtime = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });
    runtimes.push(runtime);
    await runtime.cache.read(runtime.dependencies.getSession, undefined);
    runtime.dependencies.session.setActiveOrgId('o');
    await runtime.cache.execute(runtime.dependencies.deleteOrganization, { orgId: 'o' });
    expect(runtime.cache.store.get('organization:o')).toBeUndefined();
    expect(runtime.dependencies.session.activeOrgId).toBeNull();
});

function ActiveOrganizationProbe() {
    const session = useSession();
    const selection = useActiveOrganization(session.data);

    return createElement(
        'output',
        { 'data-testid': 'selected-org' },
        selection.activeOrg?.id ?? 'none'
    );
}

it('retires the selected organization even when confirmed removal ingestion fails', async () => {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async (_url, init) =>
            init?.method === 'DELETE'
                ? new Response(null, { status: 204 })
                : Response.json({
                      id: 'u',
                      email: 'a@b.com',
                      name: 'A',
                      family: 'B',
                      isInitializing: false,
                      organizations: [{ id: 'o', name: 'Org', role: 'owner' }],
                  })
        )
    );
    const runtime = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });
    runtimes.push(runtime);
    await runtime.cache.read(runtime.dependencies.getSession, undefined);
    runtime.dependencies.session.setActiveOrgId('o');
    render(
        createElement(ClientRoot, { runtime }, createElement(ActiveOrganizationProbe))
    );
    await waitFor(() =>
        expect(screen.getByTestId('selected-org')).toHaveTextContent('o')
    );
    const failure = new Error('removal unavailable');
    vi.spyOn(runtime.cache.store, 'apply').mockRejectedValueOnce(failure);
    await act(async () => {
        const outcome = await runtime.cache.runCommand(
            runtime.dependencies.deleteOrganization,
            { orgId: 'o' }
        );
        expect(outcome.syncError).toBe(failure);
    });
    expect(runtime.dependencies.session.activeOrgId).toBeNull();
    expect(runtime.cache.tombstones.has('organization:o')).toBe(true);
    await waitFor(() =>
        expect(screen.getByTestId('selected-org')).toHaveTextContent('none')
    );
    expect(runtime.dependencies.session.activeOrgId).toBeNull();
});
