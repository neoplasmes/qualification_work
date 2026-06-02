import { chartRelationTagId, datasetRelationTagId } from './cacheTags';

export type CacheInvalidationTag =
    | 'Dashboards'
    | {
          type:
              | 'ActionRuns'
              | 'ChartData'
              | 'Charts'
              | 'Dashboards'
              | 'DatasetRows'
              | 'Datasets';
          id: string;
      };

export const chartChangedTags = (chartId: string): CacheInvalidationTag[] => [
    { type: 'Charts', id: chartId },
    { type: 'Charts', id: 'LIST' },
    { type: 'ChartData', id: chartId },
    { type: 'Dashboards', id: chartRelationTagId(chartId) },
];

export const chartCreatedTags = (datasetId: string): CacheInvalidationTag[] => [
    { type: 'Charts', id: 'LIST' },
    { type: 'Charts', id: datasetRelationTagId(datasetId) },
];

export const datasetMetadataChangedTags = (datasetId: string): CacheInvalidationTag[] => [
    { type: 'Datasets', id: 'LIST' },
    { type: 'Datasets', id: datasetId },
];

export const datasetDefinitionChangedTags = (
    datasetId: string
): CacheInvalidationTag[] => [
    ...datasetMetadataChangedTags(datasetId),
    { type: 'DatasetRows', id: datasetId },
    { type: 'ChartData', id: 'LIST' },
    { type: 'Charts', id: datasetRelationTagId(datasetId) },
    { type: 'Dashboards', id: datasetRelationTagId(datasetId) },
    'Dashboards',
];

export const datasetContentChangedTags = (datasetId: string): CacheInvalidationTag[] =>
    datasetDefinitionChangedTags(datasetId);

export const datasetRemovedTags = (datasetId: string): CacheInvalidationTag[] => [
    ...datasetDefinitionChangedTags(datasetId),
    { type: 'Charts', id: 'LIST' },
];

export const uniqueCacheInvalidationTags = (
    tags: CacheInvalidationTag[]
): CacheInvalidationTag[] => {
    const seen = new Set<string>();

    return tags.filter(tag => {
        const key = typeof tag === 'string' ? tag : `${tag.type}:${tag.id}`;
        if (seen.has(key)) {
            return false;
        }

        seen.add(key);

        return true;
    });
};
