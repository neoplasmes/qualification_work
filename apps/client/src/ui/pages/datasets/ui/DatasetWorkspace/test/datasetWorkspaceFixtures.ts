import type { DatasetColumn } from '@/core/entities/datasetColumn';
import type { DatasetRow } from '@/core/entities/datasetRow';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

export const columns = [
    {
        ref: 'datasetColumn:org-1/dataset-1/column-1',
        id: 'column-1',
        datasetId: 'dataset-1',
        key: 'amount',
        displayName: 'Amount',
        dataType: 'number',
        orderIndex: 0,
        isAnalyzable: true,
    },
    {
        ref: 'datasetColumn:org-1/dataset-1/column-2',
        id: 'column-2',
        datasetId: 'dataset-1',
        key: 'name',
        displayName: 'Name',
        dataType: 'string',
        orderIndex: 1,
        isAnalyzable: true,
    },
] satisfies DatasetColumn[];

export const selectedDataset = {
    dataset: {
        ref: 'dataset:org-1/dataset-1',
        id: 'dataset-1',
        orgId: 'org-1',
        name: 'Invoices',
        sourceType: 'manual',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
    columns,
    totalRows: 2,
} satisfies DatasetMetadata;

export const mockRows: DatasetRow[] = [
    {
        ref: 'datasetRow:org-1/dataset-1/row-1',
        id: 'row-1',
        datasetId: 'dataset-1',
        rowIndex: 0,
        data: { amount: 1, name: 'Row 1' },
    },
    {
        ref: 'datasetRow:org-1/dataset-1/row-2',
        id: 'row-2',
        datasetId: 'dataset-1',
        rowIndex: 1,
        data: { amount: 2, name: 'Row 2' },
    },
];
