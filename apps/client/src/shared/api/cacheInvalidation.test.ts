import { describe, expect, it } from 'vitest';

import {
    chartChangedTags,
    chartCreatedTags,
    datasetContentChangedTags,
    datasetMetadataChangedTags,
    datasetRemovedTags,
    uniqueCacheInvalidationTags,
} from './cacheInvalidation';

describe('cache invalidation tags', () => {
    it('invalidates dataset content and related chart/dashboard cache entries', () => {
        expect(datasetContentChangedTags('dataset-1')).toEqual([
            { type: 'Datasets', id: 'LIST' },
            { type: 'Datasets', id: 'dataset-1' },
            { type: 'DatasetRows', id: 'dataset-1' },
            { type: 'ChartData', id: 'LIST' },
            { type: 'Charts', id: 'dataset:dataset-1' },
            { type: 'Dashboards', id: 'dataset:dataset-1' },
            'Dashboards',
        ]);
    });

    it('keeps dataset metadata invalidation narrow for renames', () => {
        expect(datasetMetadataChangedTags('dataset-1')).toEqual([
            { type: 'Datasets', id: 'LIST' },
            { type: 'Datasets', id: 'dataset-1' },
        ]);
    });

    it('invalidates chart definition, data, and dashboard widgets for chart changes', () => {
        expect(chartChangedTags('chart-1')).toEqual([
            { type: 'Charts', id: 'chart-1' },
            { type: 'Charts', id: 'LIST' },
            { type: 'ChartData', id: 'chart-1' },
            { type: 'Dashboards', id: 'chart:chart-1' },
        ]);
    });

    it('invalidates dataset-related chart lists after chart creation', () => {
        expect(chartCreatedTags('dataset-1')).toEqual([
            { type: 'Charts', id: 'LIST' },
            { type: 'Charts', id: 'dataset:dataset-1' },
        ]);
    });

    it('also refreshes chart lists after dataset removal', () => {
        expect(datasetRemovedTags('dataset-1')).toContainEqual({
            type: 'Charts',
            id: 'LIST',
        });
    });

    it('deduplicates broad cache tags while preserving order', () => {
        expect(
            uniqueCacheInvalidationTags([
                { type: 'ChartData', id: 'LIST' },
                'Dashboards',
                { type: 'ChartData', id: 'LIST' },
                { type: 'DatasetRows', id: 'dataset-1' },
                'Dashboards',
            ])
        ).toEqual([
            { type: 'ChartData', id: 'LIST' },
            'Dashboards',
            { type: 'DatasetRows', id: 'dataset-1' },
        ]);
    });
});
