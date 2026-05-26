import type { Action } from '@/entities/action';

import type { ActionListFilters } from '../model';

export const filterActions = (actions: Action[], filters: ActionListFilters) => {
    const search = filters.searchText.trim().toLowerCase();
    const actionIdsByRunStatus =
        filters.runStatuses.length > 0
            ? new Set(
                  filters.runs
                      .filter(run => filters.runStatuses.includes(run.status))
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
            filters.datasetIds.length > 0 &&
            !action.effects.some(effect => filters.datasetIds.includes(effect.datasetId))
        ) {
            return false;
        }

        if (
            filters.effectKinds.length > 0 &&
            !action.effects.some(effect => filters.effectKinds.includes(effect.kind))
        ) {
            return false;
        }

        if (actionIdsByRunStatus && !actionIdsByRunStatus.has(action.id)) {
            return false;
        }

        return true;
    });
};
