import type { Action, ActionRun } from '@/entities/action';

type FilterActionsParams = {
    actions: Action[] | undefined;
    datasetIds: string[];
    effectKinds: string[];
    runStatuses: string[];
    runs: ActionRun[] | undefined;
};

export const filterActions = ({
    actions,
    datasetIds,
    effectKinds,
    runStatuses,
    runs,
}: FilterActionsParams) => {
    if (!actions) {
        return actions;
    }

    const datasetIdSet = datasetIds.length > 0 ? new Set<string>(datasetIds) : null;
    const effectKindSet = effectKinds.length > 0 ? new Set<string>(effectKinds) : null;
    const runStatusSet = runStatuses.length > 0 ? new Set<string>(runStatuses) : null;
    const actionIdsByRunStatus = runStatusSet
        ? new Set(
              (runs ?? [])
                  .filter(run => runStatusSet.has(run.status))
                  .map(run => run.actionId)
          )
        : null;

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

        if (actionIdsByRunStatus && !actionIdsByRunStatus.has(action.id)) {
            return false;
        }

        return true;
    });
};
