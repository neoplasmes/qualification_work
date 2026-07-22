import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IdbDatasetTableOptionsRepo } from './idb.datasetTableOptions.repo';

describe('IdbDatasetTableOptionsRepo', () => {
    let repo: IdbDatasetTableOptionsRepo;

    beforeEach(() => {
        repo = new IdbDatasetTableOptionsRepo();
    });

    it('returns undefined for a missing dataset', async () => {
        expect(await repo.get('missing')).toBeUndefined();
    });

    it('round-trips stored options', async () => {
        await repo.set('ds-1', { columnWidths: { a: 120 } });

        expect(await repo.get('ds-1')).toEqual({ columnWidths: { a: 120 } });
    });

    it('removes stored options', async () => {
        await repo.set('ds-1', { columnWidths: { a: 120 } });
        await repo.remove('ds-1');

        expect(await repo.get('ds-1')).toBeUndefined();
    });
});

it('does not open IndexedDB until the first browser operation', () => {
    const open = vi.spyOn(indexedDB, 'open');
    new IdbDatasetTableOptionsRepo();
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
});

it('reads the existing version one database using dataset and column keys', async () => {
    const { openDB } = await import('idb');
    const db = await openDB('datasetTableOptions', 1);
    await db.put(
        'tableOptions',
        { columnWidths: { amount: 247 }, futureOption: 'kept' },
        'legacy-dataset'
    );
    const repo = new IdbDatasetTableOptionsRepo();
    expect(await repo.get('legacy-dataset')).toEqual({
        columnWidths: { amount: 247 },
        futureOption: 'kept',
    });
    db.close();
});
