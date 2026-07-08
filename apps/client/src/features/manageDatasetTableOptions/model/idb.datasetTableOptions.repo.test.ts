import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it } from 'vitest';

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
