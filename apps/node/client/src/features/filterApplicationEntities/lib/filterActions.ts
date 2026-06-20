import type { Action } from '@/entities/action';

import type { FilterApplicationEntityValues } from '../types';

type FilterActionsParams = {
    actions: Action[] | undefined;
    values: Pick<FilterApplicationEntityValues, 'datasets' | 'effects'>;
};

export const filterActions = ({ actions, values }: FilterActionsParams) => {
    if (!actions) {
        return actions;
    }

    const datasetIds = values.datasets;
    const effectKinds = values.effects;

    const datasetIdSet = datasetIds.length > 0 ? new Set<string>(datasetIds) : null;
    const effectKindSet = effectKinds.length > 0 ? new Set<string>(effectKinds) : null;

    return actions.filter(action => {
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

        return true;
    });
};
