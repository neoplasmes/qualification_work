import type { Dataset } from '@/core/entities/dataset';
import {
    EntityProjector,
    MissingEntityError,
    type ReadCodec,
} from '@/env/cache/normalize';
import { CacheRuntime } from '@/env/cache/runtime';
import { createCacheHarness, datasetFixture } from '@/test/cacheFixtures';

import type { Query } from '@/app/queries/query';

const datasetProjector = new EntityProjector<Dataset>();

export const datasetCodec: ReadCodec<void, Dataset> = {
    async normalize(output, _input, store) {
        await store.upsert(output.ref, output);

        return { tree: { kind: 'ref', ref: output.ref }, refs: [output.ref] };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'ref' || !result.tree.ref.startsWith('dataset:')) {
            throw new Error('Invalid dataset composition');
        }
        const row = store.get(result.tree.ref as Dataset['ref']);
        if (!row) {
            throw new MissingEntityError(result.tree.ref);
        }
        const { id, orgId, name, sourceType, createdAt, updatedAt } = row;
        if (!id || !orgId || !name || !sourceType || !createdAt || !updatedAt) {
            throw new MissingEntityError(result.tree.ref);
        }

        return datasetProjector.resolve(row, [], () => ({
            ref: row.ref,
            id,
            orgId,
            name,
            sourceType,
            createdAt,
            updatedAt,
        }));
    },
};

export function createReadHarness(
    execute: Query<void, Dataset>['execute'] = async () => datasetFixture
) {
    const harness = createCacheHarness();
    const runtime = new CacheRuntime(harness.queryClient, harness.store);
    const query: Query<void, Dataset> = {
        name: 'getDataset',
        reads: () => [datasetFixture.ref],
        execute,
    };
    runtime.registerRead(query, datasetCodec);

    return { ...harness, runtime, query };
}

export function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((accept, decline) => {
        resolve = accept;
        reject = decline;
    });

    return { promise, resolve, reject };
}
