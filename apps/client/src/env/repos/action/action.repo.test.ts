import { HttpActionRepo } from '.';
import { HttpTransport } from '@/env/transport/http';
import { expect, it, vi } from 'vitest';

const run = {
    id: 'run/1',
    actionId: 'act/1',
    orgId: 'org/1',
    userId: 'u',
    parameters: { zero: 0, no: false },
    changes: [],
    status: 'failed',
    errorMessage: 'failure',
    executedAt: '2026-01-01',
};
it('accepts the creation id receipt without an implicit read', async () => {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(Response.json({ id: 'created' }, { status: 201 }));
    const repo = new HttpActionRepo(new HttpTransport({ baseUrl: '/api', fetch }));
    const input = { orgId: 'org/1', name: 'Name', parameters: [], effects: [] };
    await expect(repo.createAction(input)).resolves.toEqual({ id: 'created' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]![1]?.method).toBe('POST');
    expect(JSON.parse(String(fetch.mock.calls[0]![1]?.body))).toEqual(input);
});
it('sends exact run parameters and preserves returned business failure', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json(run));
    const repo = new HttpActionRepo(new HttpTransport({ baseUrl: '/api', fetch }));
    expect(
        await repo.executeAction({
            orgId: 'org/1',
            actionId: 'act/1',
            parameters: run.parameters,
        })
    ).toEqual({ ...run, ref: 'actionRun:org%2F1/run%2F1' });
    expect(fetch.mock.calls[0]![0]).toBe('/api/data/actions/act%2F1/runs');
    expect(JSON.parse(String(fetch.mock.calls[0]![1]?.body))).toEqual({
        parameters: run.parameters,
    });
});
it('reads both history kinds with defaults, encoding and signal', async () => {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementation(async () => Response.json([run]));
    const repo = new HttpActionRepo(new HttpTransport({ baseUrl: '/api', fetch }));
    const signal = new AbortController().signal;
    await repo.listActionRuns(
        { kind: 'action', orgId: 'org/1', actionId: 'act/1' },
        { signal }
    );
    await repo.listActionRuns({ kind: 'org', orgId: 'org/1', offset: 50, limit: 25 });
    expect(fetch.mock.calls[0]![0]).toBe(
        '/api/data/actions/act%2F1/runs?orgId=org%2F1&offset=0&limit=50'
    );
    expect(fetch.mock.calls[0]![1]?.signal).toBe(signal);
    expect(fetch.mock.calls[1]![0]).toBe(
        '/api/data/actions/runs?orgId=org%2F1&offset=50&limit=25'
    );
});
it('accepts full definition PUT204 without fabricating a response', async () => {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(new Response(null, { status: 204 }));
    const repo = new HttpActionRepo(new HttpTransport({ baseUrl: '/api', fetch }));
    const definition = { name: 'Name', parameters: [], effects: [] };
    await expect(
        repo.updateAction({ orgId: 'org/1', actionId: 'act/1', ...definition })
    ).resolves.toBeUndefined();
    expect(fetch.mock.calls[0]![1]?.method).toBe('PUT');
    expect(JSON.parse(String(fetch.mock.calls[0]![1]?.body))).toEqual(definition);
});
it('rejects history from another organization', async () => {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(Response.json([{ ...run, orgId: 'other' }]));
    const repo = new HttpActionRepo(new HttpTransport({ baseUrl: '/api', fetch }));
    await expect(repo.listActionRuns({ kind: 'org', orgId: 'org/1' })).rejects.toThrow(
        'Unexpected action run scope'
    );
});
