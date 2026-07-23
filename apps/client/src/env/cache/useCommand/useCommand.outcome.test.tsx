import { commandPolicy, createCommand } from '@/test/commandFixtures';
import { createReadHarness, deferred } from '@/test/readFixtures';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { expect, it } from 'vitest';

import { CacheProvider } from '../context';
import { useCommand } from './useCommand';

it('returns each overlapping outcome while exposing the latest invocation', async () => {
    const { runtime } = createReadHarness();
    const older = deferred<string>();
    const command = createCommand((input: string) =>
        input === 'older' ? older.promise : Promise.resolve(input)
    );
    const policy = commandPolicy<string, string>();
    const syncError = new Error('older normalization failed');
    runtime.registerCommand(command, {
        ...policy,
        conflictKey: input => input,
        codec: {
            ...policy.codec,
            async normalize(output, input, store) {
                if (input === 'older') {
                    throw syncError;
                }

                return policy.codec.normalize(output, input, store);
            },
        },
    });
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(() => useCommand(command), { wrapper: Wrapper });
    let first!: Promise<{ data: string; syncError: unknown }>;
    act(() => {
        first = hook.result.current.executeOutcome('older');
    });
    await act(async () => {
        expect(await hook.result.current.executeOutcome('newer')).toEqual({
            data: 'newer',
            syncError: null,
        });
    });
    await act(async () => {
        older.resolve('older');
        expect(await first).toEqual({ data: 'older', syncError });
    });
    await waitFor(() => expect(hook.result.current.data).toBe('newer'));
    expect(hook.result.current.syncError).toBeNull();
    hook.unmount();
    await runtime.dispose();
});
