import {
    actionFixture,
    createCacheHarness,
    datasetFixture,
    rowFixture,
} from '@/test/cacheFixtures';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EntitySnapshot, StoreWrite } from './entityStore.types';

const harnesses: ReturnType<typeof createCacheHarness>[] = [];

function harness(descriptors?: Parameters<typeof createCacheHarness>[0]) {
    const result = createCacheHarness(descriptors);
    harnesses.push(result);

    return result;
}

afterEach(async () => {
    vi.restoreAllMocks();
    for (const item of harnesses.splice(0)) {
        item.queryClient.clear();
        await item.store.dispose();
    }
});

describe('entity store', () => {
    it('merges defined fields and preserves explicit null', async () => {
        const { store } = harness();
        await store.upsert(actionFixture.ref, actionFixture);
        await store.upsert(actionFixture.ref, { name: 'new', description: undefined });
        expect(store.get(actionFixture.ref)).toMatchObject({
            name: 'new',
            description: 'keep',
        });
        await store.upsert(actionFixture.ref, { description: null });
        expect(store.get(actionFixture.ref)?.description).toBeNull();
    });

    it('replaces opaque values without traversing their contents', async () => {
        const { store } = harness();
        await store.upsert(rowFixture.ref, rowFixture);
        await store.upsert(rowFixture.ref, { data: { a: 3 } });
        expect(store.get(rowFixture.ref)?.data).toEqual({ a: 3 });
        expect(store.references(rowFixture.ref)).toEqual([]);
    });

    it('preserves row identity and emits nothing for equal records', async () => {
        const { store } = harness();
        await store.upsert(rowFixture.ref, rowFixture);
        const previous = store.get(rowFixture.ref);
        const listener = vi.fn();
        store.subscribe(rowFixture.ref, listener);
        await store.upsert(rowFixture.ref, { data: { a: 1, b: 2 } });
        expect(store.get(rowFixture.ref)).toBe(previous);
        expect(listener).not.toHaveBeenCalled();
    });

    it('notifies only the changed ref and releases subscriptions', async () => {
        const { store } = harness();
        await store.upsert(actionFixture.ref, actionFixture);
        const listener = vi.fn();
        const unsubscribe = store.subscribe(actionFixture.ref, listener);
        await store.upsert(datasetFixture.ref, datasetFixture);
        expect(listener).not.toHaveBeenCalled();
        await store.upsert(actionFixture.ref, { name: 'new' });
        expect(listener).toHaveBeenCalledTimes(1);
        unsubscribe();
        await store.remove(actionFixture.ref);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(store.get(actionFixture.ref)).toBeUndefined();
    });

    it('keeps clients isolated during writes and disposal', async () => {
        const first = harness();
        const second = harness();
        await first.store.upsert(actionFixture.ref, actionFixture);
        expect(second.store.get(actionFixture.ref)).toBeUndefined();
        await second.store.upsert(actionFixture.ref, {
            ...actionFixture,
            name: 'second',
        });
        await first.store.dispose();
        expect(second.store.get(actionFixture.ref)?.name).toBe('second');
        await expect(
            first.store.upsert(actionFixture.ref, actionFixture)
        ).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('round trips canonical rows and restores update and deletion tracking', async () => {
        const first = harness();
        await first.store.upsert(actionFixture.ref, actionFixture);
        await first.store.upsert(rowFixture.ref, rowFixture);
        first.queryClient.setQueryData(['unrelated'], { secret: true });
        const snapshot = first.store.snapshot();
        expect(snapshot).not.toHaveProperty('liveQueries');
        const second = harness();
        await second.store.hydrate(
            JSON.parse(JSON.stringify(snapshot)) as EntitySnapshot
        );
        expect(second.store.get(actionFixture.ref)).toMatchObject(actionFixture);
        expect([...second.store.keys()]).toContain(rowFixture.ref);
        await second.store.upsert(actionFixture.ref, { name: 'restored' });
        expect(second.store.get(actionFixture.ref)?.description).toBe('keep');
        const saved = second.store
            .snapshot()
            .collections.find(chunk => chunk.collectionId === 'entities:action');
        expect(saved?.rows[0].value).toEqual({ ...actionFixture, name: 'restored' });
        await second.store.remove(rowFixture.ref);
        await second.store.remove(rowFixture.ref);
        expect(second.store.get(rowFixture.ref)).toBeUndefined();
        expect(first.store.get(rowFixture.ref)).toMatchObject(rowFixture);
    });

    it('rejects a stale batch after readiness before publishing any row', async () => {
        const { store, dbClient, descriptors } = harness();
        const collection = dbClient.collection(
            descriptors.find(item => item.kind === 'action')!.options
        );
        const preload = collection.preload();
        let release!: () => void;
        const gate = new Promise<void>(resolve => {
            release = resolve;
        });
        vi.spyOn(collection, 'preload').mockImplementation(async () => {
            await preload;
            await gate;
        });
        let current = true;
        const listener = vi.fn();
        store.subscribe(datasetFixture.ref, listener);
        const pending = store.apply(
            [
                { kind: 'upsert', ref: datasetFixture.ref, patch: datasetFixture },
                { kind: 'upsert', ref: actionFixture.ref, patch: actionFixture },
            ],
            { isCurrent: () => current }
        );
        current = false;
        release();
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        expect(store.get(datasetFixture.ref)).toBeUndefined();
        expect(store.get(actionFixture.ref)).toBeUndefined();
        expect(listener).not.toHaveBeenCalled();
    });

    it('publishes a batch only after every collection is readable', async () => {
        const { store } = harness();
        const seen: unknown[] = [];
        const listener = () => {
            seen.push([
                store.get(actionFixture.ref)?.name,
                store.get(datasetFixture.ref)?.name,
            ]);
        };
        store.subscribe(actionFixture.ref, listener);
        store.subscribe(datasetFixture.ref, listener);
        await store.apply([
            { kind: 'upsert', ref: actionFixture.ref, patch: actionFixture },
            { kind: 'upsert', ref: datasetFixture.ref, patch: datasetFixture },
            { kind: 'upsert', ref: actionFixture.ref, patch: { name: 'new' } },
        ]);
        expect(seen).toEqual([['new', 'dataset']]);
    });

    it('validates every operation before accepting any collection write', async () => {
        const { store } = harness();
        const writes = [
            { kind: 'upsert', ref: actionFixture.ref, patch: actionFixture },
            {
                kind: 'upsert',
                ref: datasetFixture.ref,
                patch: { ...datasetFixture, ref: 'dataset:other/id' },
            },
        ] as StoreWrite[];
        await expect(store.apply(writes)).rejects.toThrow();
        expect(store.get(actionFixture.ref)).toBeUndefined();
        await expect(
            store.apply([
                { kind: 'remove', ref: 'session:current' },
            ] as unknown as StoreWrite[])
        ).rejects.toThrow();
    });

    it('rejects aborted writes and guarded hydration', async () => {
        const { store } = harness();
        const controller = new AbortController();
        controller.abort();
        await expect(
            store.apply(
                [{ kind: 'upsert', ref: actionFixture.ref, patch: actionFixture }],
                {
                    signal: controller.signal,
                    isCurrent: () => true,
                }
            )
        ).rejects.toMatchObject({ name: 'AbortError' });
        const source = harness();
        await source.store.upsert(actionFixture.ref, actionFixture);
        await expect(
            store.hydrate(source.store.snapshot(), { isCurrent: () => false })
        ).rejects.toMatchObject({ name: 'AbortError' });
        expect(store.get(actionFixture.ref)).toBeUndefined();
    });

    it('prevents pending writes from resurrecting a disposed store', async () => {
        const { store } = harness();
        const pending = store.upsert(actionFixture.ref, actionFixture);
        const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        await store.dispose();
        await rejected;
        expect(store.get(actionFixture.ref)).toBeUndefined();
    });

    it('replaces an existing row after removal and partial reinsertion', async () => {
        const { store } = harness();
        await store.upsert(actionFixture.ref, actionFixture);
        const seen: unknown[] = [];
        store.subscribe(actionFixture.ref, () => {
            seen.push(
                store
                    .snapshot()
                    .collections.find(chunk => chunk.collectionId === 'entities:action')
                    ?.rows[0].value
            );
        });
        await store.apply([
            { kind: 'remove', ref: actionFixture.ref },
            { kind: 'upsert', ref: actionFixture.ref, patch: { name: 'new' } },
            { kind: 'upsert', ref: datasetFixture.ref, patch: datasetFixture },
            { kind: 'remove', ref: datasetFixture.ref },
        ]);
        expect(store.get(actionFixture.ref)?.name).toBe('new');
        expect(store.get(actionFixture.ref)).not.toHaveProperty('description');
        expect(seen).toEqual([{ ref: actionFixture.ref, name: 'new' }]);
        expect(store.get(datasetFixture.ref)).toBeUndefined();
    });

    it('rejects stale hydration after delayed readiness', async () => {
        const source = harness();
        await source.store.upsert(actionFixture.ref, actionFixture);
        const { store, dbClient, descriptors } = harness();
        const collection = dbClient.collection(
            descriptors.find(item => item.kind === 'action')!.options
        );
        const preload = collection.preload();
        let release!: () => void;
        const gate = new Promise<void>(resolve => {
            release = resolve;
        });
        vi.spyOn(collection, 'preload').mockImplementation(async () => {
            await preload;
            await gate;
        });
        let current = true;
        const listener = vi.fn();
        store.subscribe(actionFixture.ref, listener);
        const pending = store.hydrate(source.store.snapshot(), {
            isCurrent: () => current,
        });
        current = false;
        release();
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        expect(store.get(actionFixture.ref)).toBeUndefined();
        expect(listener).not.toHaveBeenCalled();
    });

    it('keeps metadata out of hydration snapshots without touching opaque JSON', async () => {
        const { store } = harness();
        const hydratedRow = {
            ...rowFixture,
            $synced: false,
            data: { $synced: 'user data' },
        };
        await store.hydrate({
            collections: [
                {
                    collectionId: 'entities:datasetRow',
                    rows: [
                        {
                            key: rowFixture.ref,
                            value: hydratedRow,
                        },
                    ],
                },
            ],
        });
        const saved = store
            .snapshot()
            .collections.find(chunk => chunk.collectionId === 'entities:datasetRow');
        expect(saved?.rows[0].value).toEqual({
            ...rowFixture,
            data: { $synced: 'user data' },
        });
    });

    it('retains another ref subscription when a shared callback unsubscribes', async () => {
        const { store, dbClient, descriptors } = harness();
        const listener = vi.fn();
        const unsubscribe = store.subscribe(actionFixture.ref, listener);
        store.subscribe(datasetFixture.ref, listener);
        const collection = dbClient.collection(
            descriptors.find(item => item.kind === 'dataset')!.options
        );
        const subscription = collection.subscribeChanges(() => {
            unsubscribe();
        });
        await store.apply([
            { kind: 'upsert', ref: actionFixture.ref, patch: actionFixture },
            { kind: 'upsert', ref: datasetFixture.ref, patch: datasetFixture },
        ]);
        subscription.unsubscribe();
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('shares descriptors across clients without sharing sync state', async () => {
        const first = harness();
        const second = harness(first.descriptors);
        await first.store.upsert(actionFixture.ref, actionFixture);
        await second.store.upsert(actionFixture.ref, {
            ...actionFixture,
            name: 'independent',
        });
        await first.store.dispose();
        await second.store.upsert(actionFixture.ref, { name: 'still writable' });
        expect(second.store.get(actionFixture.ref)?.name).toBe('still writable');
        const collection = second.dbClient.collection(
            second.descriptors.find(item => item.kind === 'action')!.options
        );
        expect(second.store.get(actionFixture.ref)).toBe(
            collection.get(actionFixture.ref)
        );
    });

    it('retains incomplete inserts until a complete response arrives', async () => {
        const { store } = harness();
        await store.upsert(actionFixture.ref, { name: 'partial' });
        expect(store.get(actionFixture.ref)?.id).toBeUndefined();
        expect(store.get(actionFixture.ref)?.ref).toBe(actionFixture.ref);
        await store.upsert(actionFixture.ref, actionFixture);
        expect(store.get(actionFixture.ref)).toMatchObject(actionFixture);
    });

    it('exposes explicit relationships while leaving opaque JSON alone', async () => {
        const { store } = harness();
        await store.upsert('dashboard:org-1/dashboard-1', {
            ref: 'dashboard:org-1/dashboard-1',
            id: 'dashboard-1',
            orgId: 'org-1',
            name: 'board',
            items: ['dashboardItem:org-1/dashboard-1/item-1'],
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
        });
        await store.upsert(rowFixture.ref, {
            ...rowFixture,
            data: { reference: actionFixture.ref },
        });
        expect(store.references('dashboard:org-1/dashboard-1')).toEqual([
            'dashboardItem:org-1/dashboard-1/item-1',
        ]);
        expect(store.references(rowFixture.ref)).toEqual([]);
    });
});
