import type { EntityStore, RecordRef } from '../entityStore';
import { collectionGraceTime } from '../freshness';

export class GarbageCollector {
    private timer?: ReturnType<typeof setTimeout>;
    private generation = 0;

    constructor(
        private readonly store: EntityStore,
        private readonly roots: () => Iterable<RecordRef>
    ) {}

    reachable(): Set<RecordRef> {
        const reachable = new Set<RecordRef>();
        const pending = [...this.roots()];
        while (pending.length > 0) {
            const ref = pending.pop()!;
            if (reachable.has(ref)) {
                continue;
            }
            reachable.add(ref);
            pending.push(...this.store.references(ref));
        }

        return reachable;
    }

    schedule(): void {
        clearTimeout(this.timer);
        const generation = this.generation;
        this.timer = setTimeout(() => {
            this.timer = undefined;
            void this.sweep(generation);
        }, collectionGraceTime);
    }

    async sweep(generation = this.generation): Promise<void> {
        const reachable = this.reachable();
        for (const ref of this.store.keys()) {
            if (generation !== this.generation) {
                return;
            }
            if (!reachable.has(ref)) {
                try {
                    await this.store.apply([{ kind: 'remove', ref }], {
                        isCurrent: () =>
                            generation === this.generation && !this.reachable().has(ref),
                    });
                } catch (error) {
                    if (!(error instanceof Error && error.name === 'AbortError')) {
                        throw error;
                    }
                }
            }
        }
    }

    cancel(): void {
        this.generation++;
        clearTimeout(this.timer);
        this.timer = undefined;
    }
}
