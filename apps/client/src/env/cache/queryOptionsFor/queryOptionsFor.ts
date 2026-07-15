import { queryOptions } from '@tanstack/react-query';

import type { Query } from '@/app/queries/query';

import { readFreshness, retryRead } from '../freshness';
import type { CacheRuntime } from '../runtime';

export function queryOptionsFor<I, O>(
    runtime: CacheRuntime,
    query: Query<I, O>,
    input: I
) {
    const { policy } = runtime.registry.get(query);
    const normalizedInput = policy.normalizeInput ? policy.normalizeInput(input) : input;
    const dependencies = query.reads(normalizedInput);

    return queryOptions({
        queryKey: [query.name, normalizedInput] as const,
        queryFn: ({ signal }) => runtime.fetch(query, normalizedInput, signal),
        staleTime: policy.staleTime ?? readFreshness.staleTime,
        gcTime: policy.gcTime ?? readFreshness.gcTime,
        retry: retryRead,
        meta: { normalizedRead: true, dependencies },
    });
}
