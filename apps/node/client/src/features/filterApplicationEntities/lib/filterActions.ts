import type { Action } from '@/entities/action';

type FilterActionsParams = {
    actions: Action[] | undefined;
    datasetIds: string[];
    effectKinds: string[];
};

export const filterActions = ({
    actions,
    datasetIds,
    effectKinds,
}: FilterActionsParams) => {
    if (!actions) {
        return actions;
    }

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
