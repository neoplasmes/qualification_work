import type { EntityRef } from '@/core/entities/entityRef';

import type { CacheRuntime } from '../runtime';

export class CacheInvalidator {
    constructor(private readonly runtime: CacheRuntime) {}

    async invalidate(refs: readonly EntityRef[]): Promise<void> {
        this.runtime.fence(refs);
        const predicate = (query: Parameters<CacheRuntime['matches']>[0]) =>
            this.runtime.matches(query, refs);
        await this.runtime.queryClient.cancelQueries({ predicate });
        await this.runtime.queryClient.invalidateQueries(
            { predicate },
            { throwOnError: true }
        );
    }

    evict(refs: readonly EntityRef[]): void {
        this.runtime.fence(refs);
        this.runtime.queryClient.removeQueries({
            predicate: query => this.runtime.matches(query, refs),
        });
    }

    async invalidateAll(): Promise<void> {
        const queries = this.runtime.queryClient
            .getQueryCache()
            .getAll()
            .filter(query => this.runtime.matches(query));
        const refs = queries.flatMap(query => query.meta?.dependencies as EntityRef[]);
        this.runtime.fence(refs);
        const predicate = (query: Parameters<CacheRuntime['matches']>[0]) =>
            this.runtime.matches(query);
        await this.runtime.queryClient.cancelQueries({ predicate });
        await this.runtime.queryClient.invalidateQueries(
            { predicate },
            { throwOnError: true }
        );
    }

    clearAll(): Promise<void> {
        return this.runtime.clear();
    }
}
