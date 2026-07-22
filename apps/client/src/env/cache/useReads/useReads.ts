import { useQueries } from '@tanstack/react-query';
import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useSyncExternalStore,
} from 'react';

import type { Query } from '@/app/queries/query';

import { cacheContext } from '../context';
import { MissingEntityError } from '../normalize';
import { queryOptionsFor } from '../queryOptionsFor';

const missingEntity = Symbol('missingEntity');

export function useReads<I, O>(query: Query<I, O>, inputs: readonly I[]) {
    const runtime = useContext(cacheContext);
    if (!runtime) {
        throw new Error('CacheProvider is required');
    }
    const settings = inputs.map(input => queryOptionsFor(runtime, query, input));
    const results = useQueries({
        queries: settings.map(options => ({ ...options, refetchOnMount: false })),
    });
    const compositions = results.map(result => result.data);
    const previous = useRef(compositions);
    if (
        previous.current.length !== compositions.length ||
        compositions.some((value, index) => value !== previous.current[index])
    ) {
        previous.current = compositions;
    }
    const stableCompositions = previous.current;
    const subscriptions = useMemo(
        () => ({ version: 0, values: [] as unknown[] }),
        [runtime, query]
    );
    const subscribe = useCallback(
        (listener: () => void) => {
            const removers = stableCompositions.map(composition =>
                composition
                    ? runtime.subscribe(composition, () => {
                          listener();
                      })
                    : () => {}
            );

            return () => {
                for (const remove of removers) {
                    remove();
                }
            };
        },
        [runtime, subscriptions, stableCompositions]
    );
    const snapshot = useCallback(() => {
        const values = stableCompositions.map(composition => {
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
        });
        if (
            values.length !== subscriptions.values.length ||
            values.some((value, index) => value !== subscriptions.values[index])
        ) {
            subscriptions.values = values;
            subscriptions.version++;
        }

        return subscriptions.version;
    }, [runtime, query, subscriptions, stableCompositions]);
    useSyncExternalStore(subscribe, snapshot, snapshot);
    const reads = results.map(result => {
        let data: O | undefined;
        let missing = false;
        if (result.data) {
            try {
                data = runtime.resolve(query, result.data);
            } catch (error) {
                if (!(error instanceof MissingEntityError)) {
                    throw error;
                }
                missing = true;
            }
        }

        return {
            data,
            isPending: result.isPending || missing,
            isFetching: result.isFetching,
            error: result.error,
            missing,
        };
    });
    useEffect(() => {
        for (let index = 0; index < reads.length; index++) {
            const read = reads[index]!;
            if (read.missing && !read.isFetching && !read.error) {
                void runtime.queryClient.invalidateQueries({
                    queryKey: settings[index]!.queryKey,
                    exact: true,
                });
            }
        }
    });

    return reads;
}
