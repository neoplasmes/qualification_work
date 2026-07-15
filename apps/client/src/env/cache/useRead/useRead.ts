import { useQuery } from '@tanstack/react-query';
import { useCallback, useContext, useEffect, useSyncExternalStore } from 'react';

import type { Query } from '@/app/queries/query';

import { cacheContext } from '../context';
import { MissingEntityError } from '../normalize';
import { queryOptionsFor } from '../queryOptionsFor';

const missingEntity = Symbol('missingEntity');

export function useRead<I, O>(
    query: Query<I, O>,
    input: I,
    options?: { enabled?: boolean }
): { data: O | undefined; isPending: boolean; isFetching: boolean; error: unknown } {
    const runtime = useContext(cacheContext);
    if (!runtime) {
        throw new Error('CacheProvider is required');
    }
    const settings = queryOptionsFor(runtime, query, input);
    const result = useQuery({ ...settings, enabled: options?.enabled });
    const composition = result.data;
    const subscribe = useCallback(
        (listener: () => void) => {
            return composition ? runtime.subscribe(composition, listener) : () => {};
        },
        [runtime, composition]
    );
    const snapshot = useCallback((): O | undefined | typeof missingEntity => {
        if (!composition) {
            return undefined;
        }
        try {
            return runtime.resolve(query, composition);
        } catch (error) {
            if (error instanceof MissingEntityError) {
                return missingEntity;
            }

            throw error;
        }
    }, [runtime, query, composition]);
    const value = useSyncExternalStore(subscribe, snapshot, snapshot);
    const missing = value === missingEntity;
    const data = value === missingEntity ? undefined : value;
    useEffect(() => {
        if (
            missing &&
            options?.enabled !== false &&
            !result.isFetching &&
            !result.isError
        ) {
            void runtime.queryClient.invalidateQueries({
                queryKey: settings.queryKey,
                exact: true,
            });
        }
    }, [
        missing,
        options?.enabled,
        result.isFetching,
        result.isError,
        runtime,
        settings.queryKey,
    ]);

    return {
        data,
        isPending: result.isPending || missing,
        isFetching: result.isFetching,
        error: result.error,
    };
}
