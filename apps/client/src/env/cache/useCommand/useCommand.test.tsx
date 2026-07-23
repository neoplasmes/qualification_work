import { NetworkError } from '@/env/transport/http';
import { datasetFixture } from '@/test/cacheFixtures';
import { commandPolicy, createCommand } from '@/test/commandFixtures';
import { createReadHarness, deferred } from '@/test/readFixtures';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { expect, it, vi } from 'vitest';

import { CacheProvider } from '../context';
import { useRead } from '../useRead';
import { useCommand } from './useCommand';

it('does not rollback successful write when refetch fails', async () => {
    let failed = false;
    const syncError = new Error('refetch failed');
    const { runtime, query } = createReadHarness(async () => {
        if (failed) {
            throw syncError;
        }

        return datasetFixture;
    });
    const command = createCommand(vi.fn(async () => 'confirmed'));
    runtime.registerCommand(command, commandPolicy());
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(
        () => ({ read: useRead(query, undefined), command: useCommand(command) }),
        { wrapper: Wrapper }
    );
    await waitFor(() => expect(hook.result.current.read.data).toBeDefined());
    failed = true;
    await act(async () => {
        expect(await hook.result.current.command.executeOutcome(undefined)).toEqual({
            data: 'confirmed',
            syncError,
        });
    });
    await waitFor(() => expect(hook.result.current.command.syncError).toBe(syncError));
    expect(hook.result.current.command.error).toBeNull();
    expect(hook.result.current.command.data).toBe('confirmed');
    hook.rerender();
    expect(command.execute).toHaveBeenCalledTimes(1);
    hook.unmount();
    await runtime.dispose();
});

it('does not retry uncertain writes', async () => {
    const { runtime } = createReadHarness();
    runtime.queryClient.setDefaultOptions({ mutations: { retry: 3, retryDelay: 0 } });
    const command = createCommand(
        vi.fn(async () => {
            throw new NetworkError('lost response');
        })
    );
    runtime.registerCommand(command, commandPolicy());
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(() => useCommand(command), { wrapper: Wrapper });
    await act(async () => {
        await expect(hook.result.current.execute(undefined)).rejects.toMatchObject({
            name: 'UncertainCommandError',
        });
    });
    await waitFor(() =>
        expect(hook.result.current.error).toMatchObject({ name: 'UncertainCommandError' })
    );
    expect(command.execute).toHaveBeenCalledTimes(1);
    hook.unmount();
    await runtime.dispose();
});

it('keeps sent writes alive after unmount', async () => {
    const { runtime } = createReadHarness();
    const response = deferred<string>();
    const command = createCommand(vi.fn(() => response.promise));
    runtime.registerCommand(command, commandPolicy());
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(() => useCommand(command), { wrapper: Wrapper });
    let result!: Promise<string>;
    act(() => {
        result = hook.result.current.execute(undefined);
    });
    await waitFor(() => expect(command.execute).toHaveBeenCalledTimes(1));
    hook.unmount();
    response.resolve('saved');
    expect(await result).toBe('saved');
    await runtime.dispose();
});

it('does not expose stale completion after a session reset', async () => {
    const { runtime } = createReadHarness();
    const response = deferred<string>();
    const command = createCommand(
        vi.fn(async (input: string) => (input === 'old' ? response.promise : input))
    );
    runtime.registerCommand(command, commandPolicy());
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(() => useCommand(command), { wrapper: Wrapper });
    let old!: Promise<unknown>;
    act(() => {
        old = hook.result.current.execute('old').catch(error => error);
    });
    await waitFor(() => expect(hook.result.current.isPending).toBe(true));
    await act(() => runtime.clear());
    expect(hook.result.current.isPending).toBe(false);
    expect(hook.result.current.data).toBeUndefined();
    await act(async () => {
        await hook.result.current.execute('new');
    });
    await waitFor(() => expect(hook.result.current.data).toBe('new'));
    await act(async () => {
        response.resolve('old');
        await old;
    });
    expect(hook.result.current.data).toBe('new');
    expect(hook.result.current.error).toBeNull();
    hook.unmount();
    await runtime.dispose();
});

it('keeps concurrent invocation outcomes separate', async () => {
    const { runtime } = createReadHarness();
    const old = deferred<string>();
    const command = createCommand(async (input: string) =>
        input === 'old' ? old.promise : input
    );
    const policy = commandPolicy<string, string>();
    const syncError = new Error('old codec failed');
    runtime.registerCommand(command, {
        ...policy,
        conflictKey: input => input,
        codec: {
            ...policy.codec,
            async normalize(output, input, staging) {
                if (input === 'old') {
                    throw syncError;
                }

                return policy.codec.normalize(output, input, staging);
            },
        },
    });
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const first = renderHook(() => useCommand(command), { wrapper: Wrapper });
    const second = renderHook(() => useCommand(command), { wrapper: Wrapper });
    let pending!: Promise<{ data: string; syncError: unknown }>;
    act(() => {
        pending = first.result.current.executeOutcome('old');
    });
    await act(async () => {
        expect(await second.result.current.executeOutcome('new')).toEqual({
            data: 'new',
            syncError: null,
        });
    });
    await waitFor(() => expect(second.result.current.data).toBe('new'));
    expect(first.result.current.data).toBeUndefined();
    await act(async () => {
        old.resolve('old');
        expect(await pending).toEqual({ data: 'old', syncError });
    });
    await waitFor(() => expect(first.result.current.data).toBe('old'));
    expect(second.result.current.data).toBe('new');
    expect(second.result.current.syncError).toBeNull();
    expect(first.result.current.syncError).toBe(syncError);
    expect(first.result.current.error).toBeNull();
    first.unmount();
    second.unmount();
    await runtime.dispose();
});

it('invalidates affected reads after uncertain transport failure', async () => {
    let name = 'before';
    const { runtime, query } = createReadHarness(async () => ({
        ...datasetFixture,
        name,
    }));
    const command = createCommand(async () => {
        name = 'server changed';

        throw new NetworkError();
    });
    runtime.registerCommand(command, commandPolicy());
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(
        () => ({ read: useRead(query, undefined), command: useCommand(command) }),
        { wrapper: Wrapper }
    );
    await waitFor(() => expect(hook.result.current.read.data?.name).toBe('before'));
    await act(async () => {
        await hook.result.current.command.execute(undefined).catch(() => {});
    });
    await waitFor(() =>
        expect(hook.result.current.read.data?.name).toBe('server changed')
    );
    expect(hook.result.current.command.error).toMatchObject({
        name: 'UncertainCommandError',
    });
    hook.unmount();
    await runtime.dispose();
});

it('keeps the newest invocation state after an older failure', async () => {
    const { runtime } = createReadHarness();
    const old = deferred<string>();
    const command = createCommand(async (input: string) =>
        input === 'old' ? old.promise : input
    );
    runtime.registerCommand(command, { ...commandPolicy(), conflictKey: input => input });
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(() => useCommand(command), { wrapper: Wrapper });
    let pending!: Promise<unknown>;
    act(() => {
        pending = hook.result.current.execute('old').catch(error => error);
    });
    await act(async () => {
        await hook.result.current.execute('new');
    });
    await waitFor(() => expect(hook.result.current.data).toBe('new'));
    await act(async () => {
        old.reject(new NetworkError());
        await pending;
    });
    expect(hook.result.current.data).toBe('new');
    expect(hook.result.current.error).toBeNull();
    expect(hook.result.current.syncError).toBeNull();
    hook.unmount();
    await runtime.dispose();
});

it('resumes cancelled mounted reads after a rejected write', async () => {
    const first = deferred<typeof datasetFixture>();
    const read = vi
        .fn()
        .mockImplementationOnce(() => first.promise)
        .mockResolvedValue(datasetFixture);
    const { runtime, query } = createReadHarness(read);
    const command = createCommand(async () => {
        throw new Error('rejected');
    });
    runtime.registerCommand(command, commandPolicy());
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(
        () => ({ read: useRead(query, undefined), command: useCommand(command) }),
        { wrapper: Wrapper }
    );
    await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
    await act(async () => {
        await hook.result.current.command.execute(undefined).catch(() => {});
    });
    try {
        await waitFor(() => expect(hook.result.current.read.data?.name).toBe('dataset'));
        expect(hook.result.current.command.error).toMatchObject({ message: 'rejected' });
    } finally {
        first.resolve(datasetFixture);
        hook.unmount();
        await runtime.dispose();
    }
});

it.each(['execute', 'executeOutcome'] as const)(
    'checks the session before delivering %s',
    async method => {
        const { runtime } = createReadHarness();
        runtime.queryClient.setDefaultOptions({
            mutations: { onSuccess: () => runtime.clear() },
        });
        const command = createCommand(async () => 'old session');
        runtime.registerCommand(command, commandPolicy());
        function Wrapper({ children }: PropsWithChildren) {
            return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
        }
        const hook = renderHook(() => useCommand(command), { wrapper: Wrapper });
        try {
            await act(async () => {
                await expect(
                    hook.result.current[method](undefined)
                ).rejects.toMatchObject({
                    name: 'AbortError',
                });
            });
            expect(hook.result.current.data).toBeUndefined();
        } finally {
            hook.unmount();
            await runtime.dispose();
        }
    }
);
