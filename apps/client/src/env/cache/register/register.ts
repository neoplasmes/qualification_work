import type { Query } from '@/app/queries/query';

import type { ReadCodec } from '../normalize';

export interface ReadPolicy<I> {
    normalizeInput?(input: I): I;
    staleTime?: number;
    gcTime?: number;
}

export interface ReadRegistration<I, O> {
    codec: ReadCodec<I, O>;
    policy: ReadPolicy<I>;
}

export class ReadRegistry {
    private readonly entries = new WeakMap<object, unknown>();

    register<I, O>(
        query: Query<I, O>,
        codec: ReadCodec<I, O>,
        policy: ReadPolicy<I> = {}
    ): void {
        if (this.entries.has(query)) {
            throw new Error(`Read already registered: ${query.name}`);
        }
        this.entries.set(query, { codec, policy });
    }

    get<I, O>(query: Query<I, O>): ReadRegistration<I, O> {
        const entry = this.entries.get(query);
        if (!entry) {
            throw new Error(`Unregistered read: ${query.name}`);
        }

        return entry as ReadRegistration<I, O>;
    }
}
