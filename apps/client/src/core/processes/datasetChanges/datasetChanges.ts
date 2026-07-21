import type { Dataset } from '@/core/entities/dataset';
import type { EntityRef } from '@/core/entities/entityRef';

export function datasetChanges(
    ref: Dataset['ref'],
    kind: 'metadata' | 'content' | 'removed'
): EntityRef[] {
    const refs: EntityRef[] = ['dataset', ref];
    if (kind !== 'metadata') {
        refs.push(
            'datasetRow',
            'datasetColumn',
            'chartData',
            'metricPreview',
            'dashboard'
        );
    }
    if (kind === 'removed') {
        refs.push('chart');
    }

    return refs;
}
