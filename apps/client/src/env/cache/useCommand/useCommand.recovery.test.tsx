import type { EntityRef } from '@/core/entities/entityRef';
import { datasetFixture } from '@/test/cacheFixtures';
import { commandPolicy, createCommand } from '@/test/commandFixtures';
import { createReadHarness, datasetCodec, deferred } from '@/test/readFixtures';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { expect, it, vi } from 'vitest';

import { CacheProvider } from '../context';
import { useRead } from '../useRead';
import { useCommand } from './useCommand';

it.each([{ writes: [] as EntityRef[] }, { writes: ['chart'] as EntityRef[] }])(
    'resumes cancelled initial reads outside successful writes $writes',
    async ({ writes }) => {
        const first = deferred<typeof datasetFixture>();
        const replacement = { ...datasetFixture, name: 'replacement' };
        const read = vi
            .fn()
            .mockImplementationOnce(() => first.promise)
            .mockResolvedValue(replacement);
        const { runtime, query, store } = createReadHarness(read);
        const settledQuery = {
            name: 'settledDataset',
            reads: () => [datasetFixture.ref],
            execute: async () => datasetFixture,
        };
        runtime.registerRead(settledQuery, datasetCodec, { staleTime: Infinity });
        await runtime.read(settledQuery, undefined);
        const command = {
            ...createCommand(async () => 'confirmed'),
            writes: () => writes,
        };
        runtime.registerCommand(command, commandPolicy());
        function Wrapper({ children }: PropsWithChildren) {
            return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
        }
        const hook = renderHook(
            () => ({ read: useRead(query, undefined), command: useCommand(command) }),
            { wrapper: Wrapper }
        );
        try {
            await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
            expect(hook.result.current.read.data).toBeUndefined();
            await act(async () => {
                expect(await hook.result.current.command.execute(undefined)).toBe(
                    'confirmed'
                );
            });
            await waitFor(() =>
                expect(hook.result.current.read.data?.name).toBe('replacement')
            );
            expect(read).toHaveBeenCalledTimes(2);
            expect(
                runtime.queryClient.getQueryState(['settledDataset', undefined])
                    ?.isInvalidated
            ).toBe(false);
            await act(async () => {
                first.resolve({ ...datasetFixture, name: 'obsolete' });
                await first.promise;
            });
            expect(hook.result.current.read.data?.name).toBe('replacement');
            expect(store.get(datasetFixture.ref)?.name).toBe('replacement');
        } finally {
            first.resolve(datasetFixture);
            hook.unmount();
            await runtime.dispose();
        }
    }
);

it('shares a replacement read already waiting behind the command', async () => {
    const first = deferred<typeof datasetFixture>();
    const replacement = deferred<typeof datasetFixture>();
    const writeResponse = deferred<string>();
    let replacementSignal: AbortSignal | undefined;
    const read = vi
        .fn()
        .mockImplementationOnce(() => first.promise)
        .mockImplementation((_input, options) => {
            replacementSignal = options?.signal;

            return replacement.promise;
        });
    const { runtime, query } = createReadHarness(read);
    const command = {
        ...createCommand(vi.fn(() => writeResponse.promise)),
        writes: () => [],
    };
    runtime.registerCommand(command, commandPolicy());
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(() => useRead(query, undefined), { wrapper: Wrapper });
    try {
        await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
        const writing = runtime.execute(command, undefined);
        await waitFor(() => expect(command.execute).toHaveBeenCalledTimes(1));
        const loader = runtime.read(query, undefined);
        writeResponse.resolve('confirmed');
        await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
        expect(replacementSignal?.aborted).toBe(false);
        await act(async () => {
            replacement.resolve({ ...datasetFixture, name: 'shared' });
            await Promise.all([writing, loader]);
        });
        await waitFor(() => expect(hook.result.current.data?.name).toBe('shared'));
        expect(read).toHaveBeenCalledTimes(2);
        expect(replacementSignal?.aborted).toBe(false);
    } finally {
        first.resolve(datasetFixture);
        replacement.resolve(datasetFixture);
        writeResponse.resolve('confirmed');
        hook.unmount();
        await runtime.dispose();
    }
});
