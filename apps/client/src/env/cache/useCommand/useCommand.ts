import { useMutation } from '@tanstack/react-query';
import { useCallback, useContext, useSyncExternalStore } from 'react';

import type { Command } from '@/app/commands/command';

import { cacheContext } from '../context';

export function useCommand<I, O>(
    command: Command<I, O>
): {
    execute(input: I): Promise<O>;
    isPending: boolean;
    error: unknown;
    syncError: unknown;
    data: O | undefined;
} {
    const runtime = useContext(cacheContext);
    if (!runtime) {
        throw new Error('CacheProvider is required');
    }
    const epoch = useSyncExternalStore(
        runtime.commands.subscribe,
        runtime.commands.snapshot,
        runtime.commands.snapshot
    );
    const mutation = useMutation({
        mutationFn: ({ input, epoch }: { input: I; epoch: number }) =>
            runtime.runCommand(command, input, epoch),
        retry: false,
    });
    const mutate = mutation.mutateAsync;
    const execute = useCallback(
        async (input: I) => {
            const epoch = runtime.epoch;
            const result = await mutate({ input, epoch });
            if (epoch !== runtime.epoch) {
                throw Object.assign(new Error('Command cancelled'), {
                    name: 'AbortError',
                });
            }

            return result.data;
        },
        [mutate, runtime]
    );
    const current = mutation.variables?.epoch === epoch;

    return {
        execute,
        isPending: current && mutation.isPending,
        error: current ? mutation.error : null,
        syncError: current ? (mutation.data?.syncError ?? null) : null,
        data: current ? mutation.data?.data : undefined,
    };
}
