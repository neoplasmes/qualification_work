import type { Action } from '@/core/entities/action';
import type { Dataset } from '@/core/entities/dataset';
import type { DatasetRow } from '@/core/entities/datasetRow';
import { createCollectionSync } from '@/env/cache/collectionSync';
import { EntityStore } from '@/env/cache/entityStore';
import { DbClient } from '@tanstack/db';
import { QueryClient } from '@tanstack/react-query';

export const datasetFixture: Dataset = {
    ref: 'dataset:org-1/dataset-1',
    id: 'dataset-1',
    orgId: 'org-1',
    name: 'dataset',
    sourceType: 'manual',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
};

export const actionFixture: Action = {
    ref: 'action:org-1/action-1',
    id: 'action-1',
    orgId: 'org-1',
    name: 'old',
    description: 'keep',
    parameters: [],
    effects: [],
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
};

export const rowFixture: DatasetRow = {
    ref: 'datasetRow:org-1/dataset-1/row-1',
    id: 'row-1',
    datasetId: 'dataset-1',
    rowIndex: 0,
    data: { a: 1, b: 2 },
};

export function createCacheHarness(
    descriptors = [
        createCollectionSync('user'),
        createCollectionSync('organization'),
        createCollectionSync('dataset'),
        createCollectionSync('datasetColumn'),
        createCollectionSync('datasetRow'),
        createCollectionSync('chart'),
        createCollectionSync('dashboard', row => row.items ?? []),
        createCollectionSync('dashboardItem'),
        createCollectionSync('action'),
        createCollectionSync('actionRun'),
    ]
) {
    const dbClient = new DbClient();
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    const store = new EntityStore(dbClient, descriptors);

    return { dbClient, queryClient, descriptors, store };
}
