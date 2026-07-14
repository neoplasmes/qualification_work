import {
    collectionOptions,
    type CollectionConfig,
    type DbClient,
    type SyncConfig,
} from '@tanstack/db';

import type {
    NormalizedRow,
    NormalizedRowMap,
    RecordKind,
    RecordRef,
} from '../entityStore';

type SyncControls = Parameters<SyncConfig<NormalizedRow, RecordRef>['sync']>[0];

export function createCollectionSync<K extends RecordKind>(
    kind: K,
    references?: (row: NormalizedRowMap[K]) => readonly RecordRef[]
) {
    const controls = new WeakMap<DbClient, SyncControls>();
    const options = collectionOptions(
        `entities:${kind}`,
        (client): CollectionConfig<NormalizedRow, RecordRef> => ({
            id: `entities:${kind}`,
            getKey: entity => entity.ref,
            gcTime: Infinity,
            sync: {
                rowUpdateMode: 'partial',
                sync(params) {
                    controls.set(client, params);
                    params.markReady();

                    return () => {
                        controls.delete(client);
                    };
                },
            },
        })
    );

    return {
        kind,
        options,
        controls,
        references: (row: NormalizedRow): readonly RecordRef[] =>
            references?.(row as NormalizedRowMap[K]) ?? [],
    };
}

export type CollectionDescriptor = ReturnType<typeof createCollectionSync>;
