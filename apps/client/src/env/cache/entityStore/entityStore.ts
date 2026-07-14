import type {
    Collection,
    DbClient,
    DehydratedDbState,
    SyncAppliedReceipt,
} from '@tanstack/db';
import { isEqual } from 'es-toolkit';

import type { CollectionDescriptor } from '../collectionSync';
import type {
    EntitySnapshot,
    NormalizedRow,
    NormalizedRowMap,
    RecordKind,
    RecordPatch,
    RecordRef,
    StoreWrite,
    WriteGuard,
} from './entityStore.types';

const virtualFields = new Set([
    '$synced',
    '$origin',
    '$key',
    '$collectionId',
    '$hasPendingWrites',
]);

function cleanRow<R extends object>(row: R): R {
    const entries = Object.entries(row).filter(
        ([key, value]) => value !== undefined && !virtualFields.has(key)
    );

    return Object.fromEntries(entries) as R;
}

type Binding = {
    descriptor: CollectionDescriptor;
    collection: Collection<NormalizedRow, RecordRef>;
};

export class EntityStore {
    private readonly bindings = new Map<RecordKind, Binding>();
    private readonly listeners = new Map<RecordRef, Set<() => void>>();
    private readonly subscriptions: Array<() => void> = [];
    private readonly notifications = new Set<RecordRef>();
    private batches = 0;
    private disposed = false;
    private cleanup?: Promise<void>;

    constructor(
        private readonly dbClient: DbClient,
        descriptors: readonly CollectionDescriptor[]
    ) {
        for (const descriptor of descriptors) {
            if (this.bindings.has(descriptor.kind)) {
                throw new Error(`Duplicate collection: ${descriptor.kind}`);
            }
            const collection = dbClient.collection(descriptor.options);
            this.bindings.set(descriptor.kind, { descriptor, collection });
            const subscription = collection.subscribeChanges(changes => {
                for (const change of changes) {
                    this.notifications.add(change.key);
                }
                if (this.batches === 0) {
                    this.publish();
                }
            });
            this.subscriptions.push(() => subscription.unsubscribe());
        }
    }

    private binding(ref: RecordRef): Binding {
        const separator = ref.indexOf(':');
        const binding = this.bindings.get(ref.slice(0, separator) as RecordKind);
        if (separator < 1 || separator === ref.length - 1 || !binding) {
            throw new Error(`Unknown record ref: ${ref}`);
        }

        return binding;
    }

    private assertCurrent(guard?: WriteGuard): void {
        if (this.disposed || guard?.signal?.aborted || (guard && !guard.isCurrent())) {
            throw Object.assign(new Error('Store write cancelled'), {
                name: 'AbortError',
            });
        }
    }

    private publish(): void {
        const listeners = new Set<() => void>();
        for (const ref of this.notifications) {
            for (const listener of this.listeners.get(ref) ?? []) {
                listeners.add(listener);
            }
        }
        this.notifications.clear();
        for (const listener of listeners) {
            listener();
        }
    }

    get<K extends RecordKind>(ref: RecordRef<K>): NormalizedRowMap[K] | undefined {
        if (this.disposed) {
            return undefined;
        }

        return this.binding(ref).collection.get(ref) as NormalizedRowMap[K] | undefined;
    }

    upsert<K extends RecordKind>(
        ref: RecordRef<K>,
        patch: RecordPatch<NoInfer<K>>
    ): Promise<void> {
        return this.apply([{ kind: 'upsert', ref, patch } as StoreWrite]);
    }

    remove(ref: RecordRef): Promise<void> {
        return this.apply([{ kind: 'remove', ref }]);
    }

    subscribe(ref: RecordRef, listener: () => void): () => void {
        this.assertCurrent();
        this.binding(ref);
        let listeners = this.listeners.get(ref);
        if (!listeners) {
            this.listeners.set(ref, (listeners = new Set()));
        }
        listeners.add(listener);

        return () => {
            listeners.delete(listener);
            if (listeners.size === 0) {
                this.listeners.delete(ref);
            }
        };
    }

    *keys(): IterableIterator<RecordRef> {
        if (this.disposed) {
            return;
        }
        for (const { collection } of this.bindings.values()) {
            yield* collection.keys();
        }
    }

    references(ref: RecordRef): readonly RecordRef[] {
        const row = this.get(ref);

        return row ? this.binding(ref).descriptor.references(row) : [];
    }

    async apply(writes: readonly StoreWrite[], guard?: WriteGuard): Promise<void> {
        this.assertCurrent(guard);
        const touched = new Set(writes.map(write => this.binding(write.ref)));
        await Promise.all([...touched].map(({ collection }) => collection.preload()));
        this.assertCurrent(guard);

        const staged = new Map<RecordRef, NormalizedRow | undefined>();
        for (const write of writes) {
            if (write.kind === 'remove') {
                staged.set(write.ref, undefined);

                continue;
            }
            if (
                write.kind !== 'upsert' ||
                !write.patch ||
                typeof write.patch !== 'object'
            ) {
                throw new Error('Invalid store operation');
            }
            if (write.patch.ref !== undefined && write.patch.ref !== write.ref) {
                throw new Error('Record key mismatch');
            }
            const previous = staged.has(write.ref)
                ? staged.get(write.ref)
                : this.get(write.ref);
            const patch = Object.fromEntries(
                Object.entries(write.patch).filter(([, value]) => value !== undefined)
            );
            staged.set(write.ref, {
                ...previous,
                ...patch,
                ref: write.ref,
            } as NormalizedRow);
        }

        const prepared = new Map<
            Binding,
            Array<{ ref: RecordRef; row: NormalizedRow | undefined; exists: boolean }>
        >();
        for (const [ref, row] of staged) {
            const previous = this.get(ref);
            if (isEqual(previous, row)) {
                continue;
            }
            const binding = this.binding(ref);
            let operations = prepared.get(binding);
            if (!operations) {
                prepared.set(binding, (operations = []));
            }
            operations.push({
                ref,
                row: row && cleanRow(row),
                exists: previous !== undefined,
            });
        }
        const batches = [...prepared].map(([binding, operations]) => {
            const controls = binding.descriptor.controls.get(this.dbClient);
            if (!controls) {
                throw new Error('Collection sync is unavailable');
            }

            return { controls, operations };
        });

        this.assertCurrent(guard);
        this.batches++;
        try {
            const receipts: SyncAppliedReceipt[] = [];
            for (const { controls, operations } of batches) {
                controls.begin();
                for (const { ref, row, exists } of operations) {
                    if (row) {
                        controls.write({
                            type: exists ? 'update' : 'insert',
                            value: row,
                        });
                    } else {
                        controls.write({ type: 'delete', key: ref });
                    }
                }
                receipts.push(controls.commit(guard?.signal));
            }
            await Promise.all(receipts);
        } finally {
            this.batches--;
            if (this.batches === 0) {
                this.publish();
            }
        }
    }

    snapshot(): EntitySnapshot {
        this.assertCurrent();
        const snapshot = this.dbClient.dehydrate({
            shouldDehydrateLiveQuery: () => false,
        });

        return {
            collections: snapshot.collections.map(chunk => ({
                ...chunk,
                rows: chunk.rows.map(row => ({ ...row, value: cleanRow(row.value) })),
            })),
        } as unknown as EntitySnapshot;
    }

    async hydrate(snapshot: EntitySnapshot, guard?: WriteGuard): Promise<void> {
        this.assertCurrent(guard);
        const touched = new Set<Binding>();
        for (const chunk of snapshot.collections) {
            const binding = [...this.bindings.values()].find(
                item => item.descriptor.options.id === chunk.collectionId
            );
            if (!binding) {
                throw new Error(`Unknown collection: ${chunk.collectionId}`);
            }
            for (const row of chunk.rows) {
                if (row.key !== row.value.ref || this.binding(row.key) !== binding) {
                    throw new Error('Snapshot key mismatch');
                }
            }
            touched.add(binding);
        }
        const prepared = {
            collections: snapshot.collections.map(chunk => ({
                ...chunk,
                rows: chunk.rows.map(row => ({ ...row, value: cleanRow(row.value) })),
            })),
        };
        await Promise.all([...touched].map(({ collection }) => collection.preload()));
        this.assertCurrent(guard);
        this.batches++;
        try {
            this.dbClient.hydrate(prepared as unknown as DehydratedDbState);
        } finally {
            this.batches--;
            if (this.batches === 0) {
                this.publish();
            }
        }
    }

    dispose(): Promise<void> {
        if (this.cleanup) {
            return this.cleanup;
        }
        this.disposed = true;
        for (const unsubscribe of this.subscriptions) {
            unsubscribe();
        }
        this.listeners.clear();
        this.notifications.clear();
        this.cleanup = this.dbClient.cleanup();

        return this.cleanup;
    }
}
