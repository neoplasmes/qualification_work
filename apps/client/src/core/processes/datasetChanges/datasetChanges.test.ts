import { datasetChanges } from '.';
import { expect, it } from 'vitest';

it('declares exact dataset changes with organization-scoped addresses', () => {
    const ref = 'dataset:org%2F1/data%2F1';
    expect(datasetChanges(ref, 'metadata')).toEqual(['dataset', ref]);
    const content = [
        'dataset',
        ref,
        'datasetRow',
        'datasetColumn',
        'chartData',
        'metricPreview',
        'dashboard',
    ];
    expect(datasetChanges(ref, 'content')).toEqual(content);
    expect(datasetChanges(ref, 'removed')).toEqual([...content, 'chart']);
    expect(datasetChanges('dataset:other/data%2F1', 'content')[1]).not.toBe(ref);
});
