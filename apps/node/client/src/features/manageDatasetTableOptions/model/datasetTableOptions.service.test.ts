import { beforeEach, describe, expect, it } from 'vitest';

import type {
    DatasetTableOptions,
    DatasetTableOptionsRepo,
} from './datasetTableOptions.repo';
import { DatasetTableOptionsService } from './datasetTableOptions.service';

// in-memory repo for fast, storage-free service tests
class FakeRepo implements DatasetTableOptionsRepo {
    readonly store = new Map<string, DatasetTableOptions>();

    async get(datasetId: string) {
        return this.store.get(datasetId);
    }

    async set(datasetId: string, options: DatasetTableOptions) {
        this.store.set(datasetId, options);
    }

    async remove(datasetId: string) {
        this.store.delete(datasetId);
    }
}

describe('DatasetTableOptionsService', () => {
    let repo: FakeRepo;
    let service: DatasetTableOptionsService;

    beforeEach(() => {
        repo = new FakeRepo();
        service = new DatasetTableOptionsService(repo);
    });

    it('returns empty widths when nothing stored', async () => {
        expect(await service.getColumnWidths('ds-1')).toEqual({});
    });

    it('persists and reads back widths', async () => {
        await service.saveColumnWidths('ds-1', { a: 120, b: 200 });

        expect(await service.getColumnWidths('ds-1')).toEqual({ a: 120, b: 200 });
    });

    it('drops non-positive and non-finite widths on save', async () => {
        await service.saveColumnWidths('ds-1', {
            a: 100,
            b: 0,
            c: -5,
            d: Number.NaN,
        });

        expect(await service.getColumnWidths('ds-1')).toEqual({ a: 100 });
    });

    it('keeps other option fields intact when saving widths', async () => {
        await repo.set('ds-1', {
            columnWidths: { a: 50 },
            // future field that must survive a widths update
            sortOrder: 'asc',
        } as DatasetTableOptions);

        await service.saveColumnWidths('ds-1', { a: 80 });

        expect(await repo.get('ds-1')).toMatchObject({
            columnWidths: { a: 80 },
            sortOrder: 'asc',
        });
    });
});
