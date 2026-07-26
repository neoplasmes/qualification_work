import { actionCodec, actionListCodec, actionRunCodec, actionRunListCodec } from '..';
import type { ActionRun } from '@/core/entities/actionRun';
import { actionFixture, createCacheHarness, rowFixture } from '@/test/cacheFixtures';
import { expect, it } from 'vitest';

it('shares canonical projections while treating snapshots and parameter JSON as opaque', async () => {
    const { store } = createCacheHarness();
    await store.upsert(rowFixture.ref, rowFixture);
    const run: ActionRun = {
        ref: 'actionRun:org-1/run',
        id: 'run',
        orgId: 'org-1',
        actionId: 'action-1',
        userId: 'u',
        status: 'success',
        errorMessage: null,
        executedAt: '',
        parameters: { id: 'looks-like-entity', ref: rowFixture.ref, kind: 'ref' },
        changes: [
            {
                kind: 'updateRowsByMatch',
                datasetId: 'dataset-1',
                match: { columnKey: 'a', value: { ref: rowFixture.ref } },
                rowIds: ['row-1'],
                before: [
                    { rowId: 'row-1', rowIndex: 0, data: { a: 9, ref: rowFixture.ref } },
                ],
                after: [{ rowId: 'row-1', rowIndex: 0, data: { a: 20 } }],
            },
        ],
    };
    const detail = await actionRunCodec.normalize(run, undefined, store);
    const list = await actionRunListCodec.normalize([run], undefined, store);
    expect(actionRunListCodec.resolve(list, store)[0]).toBe(
        actionRunCodec.resolve(detail, store)
    );
    expect(actionRunCodec.resolve(detail, store)).toEqual(run);
    expect(store.get(rowFixture.ref)?.data).toEqual(rowFixture.data);
    expect([...store.keys()].sort()).toEqual([rowFixture.ref, run.ref].sort());
    const actionDetail = await actionCodec.normalize(actionFixture, undefined, store);
    const actionList = await actionListCodec.normalize([actionFixture], undefined, store);
    expect(actionListCodec.resolve(actionList, store)[0]).toBe(
        actionCodec.resolve(actionDetail, store)
    );
    await store.dispose();
});
