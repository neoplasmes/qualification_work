import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import type { DatasetMetadata } from '@/entities/dataset';

import type { DatasetChartBuilderProps } from '../../model';
import { DatasetChartBuilder } from '../DatasetChartBuilder';

const baseDataset = {
    dataset: {
        id: 'dataset-1',
        orgId: 'org-1',
        name: 'sales',
        sourceType: 'csv' as const,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
    columns: [
        {
            id: 'city',
            datasetId: 'dataset-1',
            key: 'city',
            displayName: 'city',
            dataType: 'string' as const,
            orderIndex: 0,
            isAnalyzable: true,
        },
        {
            id: 'country',
            datasetId: 'dataset-1',
            key: 'country',
            displayName: 'country',
            dataType: 'string' as const,
            orderIndex: 1,
            isAnalyzable: true,
        },
        {
            id: 'score',
            datasetId: 'dataset-1',
            key: 'score',
            displayName: 'score',
            dataType: 'number' as const,
            orderIndex: 2,
            isAnalyzable: true,
        },
    ],
    totalRows: 10,
} satisfies DatasetMetadata;

type RenderDatasetChartBuilderOptions = Omit<DatasetChartBuilderProps, 'orgId'> & {
    orgId?: string;
};

export const createTestDataset = (sequence: number): DatasetMetadata => {
    const datasetId = `dataset-${sequence}`;

    return {
        ...baseDataset,
        dataset: { ...baseDataset.dataset, id: datasetId },
        columns: baseDataset.columns.map(column => ({ ...column, datasetId })),
    };
};

export const setColumnAnalyzable = (
    dataset: DatasetMetadata,
    columnId: string,
    isAnalyzable: boolean
): DatasetMetadata => ({
    ...dataset,
    columns: dataset.columns.map(column =>
        column.id === columnId ? { ...column, isAnalyzable } : column
    ),
});

export const renderDatasetChartBuilder = ({
    orgId = 'org-1',
    ...props
}: RenderDatasetChartBuilderOptions): RenderResult =>
    render(
        <MemoryRouter>
            <DatasetChartBuilder orgId={orgId} {...props} />
        </MemoryRouter>
    );
