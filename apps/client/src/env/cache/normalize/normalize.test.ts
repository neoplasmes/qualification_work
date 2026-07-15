import type { Dataset } from '@/core/entities/dataset';
import { datasetFixture, rowFixture } from '@/test/cacheFixtures';
import { createReadHarness, datasetCodec } from '@/test/readFixtures';
import { describe, expect, it } from 'vitest';

import type { Query } from '@/app/queries/query';

import { EntityProjector } from './entityProjector';
import type { ReadCodec } from './normalize';

describe('normalization', () => {
    it('normalizes list and detail into one clean record', async () => {
        const { runtime, query, queryClient } = createReadHarness();
        const list: Query<void, Dataset[]> = {
            name: 'listDatasets',
            reads: () => ['dataset'],
            execute: async () => [datasetFixture],
        };
        runtime.registerRead(list, {
            async normalize(output, input, store) {
                const child = await datasetCodec.normalize(output[0]!, input, store);

                return {
                    tree: { kind: 'array', children: [child.tree] },
                    refs: child.refs,
                };
            },
            resolve(result, store) {
                if (result.tree.kind !== 'array') {
                    throw new Error('Invalid list');
                }

                return result.tree.children.map(tree =>
                    datasetCodec.resolve({ tree, refs: result.refs }, store)
                );
            },
        });
        const listView = await runtime.read(list, undefined);
        const detailView = await runtime.read(query, undefined);
        expect(listView[0]).toBe(detailView);
        expect(Object.keys(detailView).some(key => key.startsWith('$'))).toBe(false);
        expect(queryClient.getQueryData(['getDataset', undefined])).toEqual({
            tree: { kind: 'ref', ref: datasetFixture.ref },
            refs: [datasetFixture.ref],
        });
        await runtime.dispose();
    });

    it('preserves opaque row JSON', async () => {
        const { runtime, store } = createReadHarness();
        const value = { ref: 'dataset:fake', id: 'x', $synced: false };
        const query: Query<void, typeof value> = {
            name: 'opaque',
            reads: () => ['datasetRow'],
            execute: async () => value,
        };
        const codec: ReadCodec<void, typeof value> = {
            async normalize(output, _input, staging) {
                await staging.upsert(rowFixture.ref, { ...rowFixture, data: output });

                return { tree: { kind: 'value', value: output }, refs: [rowFixture.ref] };
            },
            resolve(result) {
                if (result.tree.kind !== 'value') {
                    throw new Error('Invalid value');
                }

                return result.tree.value as typeof value;
            },
        };
        runtime.registerRead(query, codec);
        expect(JSON.stringify(await runtime.read(query, undefined))).toBe(
            JSON.stringify(value)
        );
        expect(store.get(rowFixture.ref)?.data).toEqual(value);
        await runtime.dispose();
    });

    it('rejects incomplete staged rows without partial publication', async () => {
        const { runtime, query, store } = createReadHarness(async () => ({
            ...datasetFixture,
            name: '',
        }));
        await expect(runtime.read(query, undefined)).rejects.toThrow();
        expect(store.get(datasetFixture.ref)).toBeUndefined();
        await runtime.dispose();
    });
});

it('memoizes entity projections by own row and child identities', () => {
    const projector = new EntityProjector<{ name: string; children: object[] }>();
    const row = { name: 'parent' };
    const child = { id: 'child' };
    const first = projector.resolve(row, [child], () => ({
        name: row.name,
        children: [child],
    }));
    expect(
        projector.resolve(row, [child], () => ({ name: row.name, children: [child] }))
    ).toBe(first);
    const nextChild = { id: 'child', updated: true };
    const next = projector.resolve(row, [nextChild], () => ({
        name: row.name,
        children: [nextChild],
    }));
    expect(next).not.toBe(first);
    expect(next.children[0]).toBe(nextChild);
});
