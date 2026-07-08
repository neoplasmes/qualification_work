import type { ActionRun } from '@/entities/action';

import {
    datasetContentChangedTags,
    uniqueCacheInvalidationTags,
    type CacheInvalidationTag,
} from '@/shared/api';

export const getActionRunAffectedDatasetIds = (
    run: Pick<ActionRun, 'changes'> | undefined
) => {
    if (!run) {
        return [];
    }

    return Array.from(new Set(run.changes.map(change => change.datasetId)));
};

export const getExecuteActionInvalidationTags = (
    run: Pick<ActionRun, 'changes'> | undefined,
    actionId: string
): CacheInvalidationTag[] => {
    const datasetIds = getActionRunAffectedDatasetIds(run);
    const tags: CacheInvalidationTag[] = [
        { type: 'ActionRuns', id: 'LIST' },
        { type: 'ActionRuns', id: actionId },
        'Dashboards',
    ];

    if (datasetIds.length === 0) {
        return tags;
    }

    for (const datasetId of datasetIds) {
        tags.push(...datasetContentChangedTags(datasetId));
    }

    return uniqueCacheInvalidationTags(tags);
};
