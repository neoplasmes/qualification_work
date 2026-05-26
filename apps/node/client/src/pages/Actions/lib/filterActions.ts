import type { Action } from '@/entities/action';

import type { ActionListFilters } from '../model';

export const filterActions = (actions: Action[], filters: ActionListFilters) => {
    const search = filters.searchText.trim().toLowerCase();
    const datasetIdSet =
        filters.datasetIds.length > 0 ? new Set(filters.datasetIds) : null;
    const effectKindSet =
        filters.effectKinds.length > 0 ? new Set(filters.effectKinds) : null;
    const runStatusSet =
        filters.runStatuses.length > 0 ? new Set(filters.runStatuses) : null;
    const actionIdsByRunStatus = runStatusSet
        ? new Set(
              filters.runs
                  .filter(run => runStatusSet.has(run.status))
                  .map(run => run.actionId)
          )
        : null;

    return actions.filter(action => {
        if (
            search &&
            !action.name.toLowerCase().includes(search) &&
            !(action.description ?? '').toLowerCase().includes(search)
        ) {
            return false;
        }

        if (
            datasetIdSet &&
            !action.effects.some(effect => datasetIdSet.has(effect.datasetId))
        ) {
            return false;
        }

        if (
            effectKindSet &&
            !action.effects.some(effect => effectKindSet.has(effect.kind))
        ) {
            return false;
        }

        if (actionIdsByRunStatus && !actionIdsByRunStatus.has(action.id)) {
            return false;
        }

        return true;
    });
};
