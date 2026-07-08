import { describe, expect, it } from 'vitest';

import type { ActionRun } from '@/entities/action';

import {
    getActionRunAffectedDatasetIds,
    getExecuteActionInvalidationTags,
} from './executeActionInvalidation';

const actionRun = {
    changes: [
        {
            kind: 'insertRow',
            datasetId: 'dataset-1',
            rowId: 'row-1',
            rowIndex: 0,
            data: {},
        },
        {
            kind: 'updateRowsByMatch',
            datasetId: 'dataset-1',
            match: {
                columnKey: 'email',
                value: 'one@example.com',
            },
            rowIds: ['row-1'],
            before: [],
            after: [],
        },
        {
            kind: 'insertRow',
            datasetId: 'dataset-2',
            rowId: 'row-2',
            rowIndex: 1,
            data: {},
        },
    ],
} satisfies Pick<ActionRun, 'changes'>;

describe('execute action cache invalidation', () => {
    it('deduplicates affected datasets in run changes', () => {
        expect(getActionRunAffectedDatasetIds(actionRun)).toEqual([
            'dataset-1',
            'dataset-2',
        ]);
    });

    it('invalidates datasets, chart data, related charts, and dashboards', () => {
        expect(getExecuteActionInvalidationTags(actionRun, 'action-1')).toEqual([
            { type: 'ActionRuns', id: 'LIST' },
            { type: 'ActionRuns', id: 'action-1' },
            'Dashboards',
            { type: 'Datasets', id: 'LIST' },
            { type: 'Datasets', id: 'dataset-1' },
            { type: 'DatasetRows', id: 'dataset-1' },
            { type: 'ChartData', id: 'LIST' },
            { type: 'Charts', id: 'dataset:dataset-1' },
            { type: 'Dashboards', id: 'dataset:dataset-1' },
            { type: 'Datasets', id: 'dataset-2' },
            { type: 'DatasetRows', id: 'dataset-2' },
            { type: 'Charts', id: 'dataset:dataset-2' },
            { type: 'Dashboards', id: 'dataset:dataset-2' },
        ]);
    });

    it('invalidates dashboards even without applied changes', () => {
        expect(getExecuteActionInvalidationTags({ changes: [] }, 'action-1')).toEqual([
            { type: 'ActionRuns', id: 'LIST' },
            { type: 'ActionRuns', id: 'action-1' },
            'Dashboards',
        ]);
    });
});
