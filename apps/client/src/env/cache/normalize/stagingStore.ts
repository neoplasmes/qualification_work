import type {
    EntityStore,
    NormalizedRow,
    NormalizedRowMap,
    RecordKind,
    RecordPatch,
    RecordRef,
    StagingStore,
    StoreWrite,
} from '../entityStore';

const virtualFields = new Set([
    '$synced',
    '$origin',
    '$key',
    '$collectionId',
    '$hasPendingWrites',
]);

export class ProjectionStore implements StagingStore {
    private readonly projections = new WeakMap<object, object>();

    constructor(
        private readonly store: EntityStore,
        private readonly tombstones: Set<RecordRef>
    ) {}

    get<K extends RecordKind>(ref: RecordRef<K>): NormalizedRowMap[K] | undefined {
        if (this.tombstones.has(ref)) {
            return undefined;
        }
        const row = this.store.get(ref);
        if (!row) {
            return undefined;
        }
        let projection = this.projections.get(row);
        if (!projection) {
            projection = Object.fromEntries(
                Object.entries(row).filter(([key]) => !virtualFields.has(key))
            );
            this.projections.set(row, projection);
        }

        return projection as NormalizedRowMap[K];
    }

    async upsert(): Promise<void> {
        throw new Error('Resolution is read only');
    }
    async remove(): Promise<void> {
        throw new Error('Resolution is read only');
    }
}

export class ReadStagingStore implements StagingStore {
    readonly writes: StoreWrite[] = [];
    private readonly rows = new Map<RecordRef, NormalizedRow | undefined>();

    constructor(
        private readonly source: StagingStore,
        private readonly lease: Set<RecordRef>
    ) {}

    get<K extends RecordKind>(ref: RecordRef<K>): NormalizedRowMap[K] | undefined {
        return this.rows.has(ref)
            ? (this.rows.get(ref) as NormalizedRowMap[K] | undefined)
            : this.source.get(ref);
    }

    async upsert<K extends RecordKind>(
        ref: RecordRef<K>,
        patch: RecordPatch<NoInfer<K>>
    ): Promise<void> {
        this.lease.add(ref);
        if (patch.ref !== undefined && patch.ref !== ref) {
            throw new Error('Record key mismatch');
        }
        const clean = Object.fromEntries(
            Object.entries(patch).filter(
                ([key, value]) => value !== undefined && !virtualFields.has(key)
            )
        );
        this.rows.set(ref, { ...this.get(ref), ...clean, ref } as NormalizedRow);
        this.writes.push({ kind: 'upsert', ref, patch: clean } as StoreWrite);
    }

    async remove(ref: RecordRef): Promise<void> {
        this.lease.add(ref);
        this.rows.set(ref, undefined);
        this.writes.push({ kind: 'remove', ref });
    }
}
