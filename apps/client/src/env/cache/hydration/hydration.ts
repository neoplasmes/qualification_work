import { dehydrate, hydrate, type DehydratedState } from '@tanstack/react-query';

import type { EntitySnapshot } from '../entityStore';
import type { CacheRuntime } from '../runtime';

export interface AppSnapshot {
    version: 1;
    scopeId: string;
    entities: EntitySnapshot;
    queries: DehydratedState;
}

export interface DeferredReadPayload {
    kind: 'cacheRead';
    snapshot: AppSnapshot;
}

export function createAppSnapshot(cache: CacheRuntime, scopeId: string): AppSnapshot {
    return {
        version: 1,
        scopeId,
        entities: cache.store.snapshot(),
        queries: dehydrate(cache.queryClient, {
            shouldDehydrateMutation: () => false,
            shouldDehydrateQuery: query =>
                query.meta?.normalizedRead === true && query.state.status === 'success',
        }),
    };
}

export function serializeSnapshot(snapshot: unknown): string {
    const escapes: Record<string, string> = {
        '<': '\\u003c',
        '>': '\\u003e',
        '&': '\\u0026',
        '\u2028': '\\u2028',
        '\u2029': '\\u2029',
    };

    return JSON.stringify(snapshot).replace(
        /[<>&\u2028\u2029]/g,
        character => escapes[character]!
    );
}

export async function hydrateAppSnapshot(
    cache: CacheRuntime,
    snapshot: AppSnapshot,
    scope: () => string
): Promise<boolean> {
    const epoch = cache.epoch;
    const isCurrent = () =>
        snapshot.version === 1 && snapshot.scopeId === scope() && epoch === cache.epoch;
    if (!isCurrent()) {
        return false;
    }
    await cache.clearing;
    if (!isCurrent()) {
        return false;
    }
    const lease = cache.acquireLease();
    try {
        for (const collection of snapshot.entities.collections) {
            for (const row of collection.rows) {
                lease.refs.add(row.key);
            }
        }
        await cache.store.hydrate(snapshot.entities, { isCurrent });
        if (!isCurrent()) {
            return false;
        }
        hydrate(cache.queryClient, snapshot.queries);

        return true;
    } finally {
        lease.release();
    }
}

export async function observeDeferredReads(
    value: unknown,
    cache: CacheRuntime,
    scope: () => string,
    onError: (error: unknown) => void
): Promise<void> {
    if (!value || typeof value !== 'object') {
        return;
    }
    if ('then' in value && typeof value.then === 'function') {
        void Promise.resolve(value)
            .then(resolved => observeDeferredReads(resolved, cache, scope, onError))
            .catch(onError);

        return;
    }
    if ('kind' in value && value.kind === 'cacheRead' && 'snapshot' in value) {
        await hydrateAppSnapshot(cache, (value as DeferredReadPayload).snapshot, scope);

        return;
    }
    for (const child of Object.values(value)) {
        await observeDeferredReads(child, cache, scope, onError);
    }
}
