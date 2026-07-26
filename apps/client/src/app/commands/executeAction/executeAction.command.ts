import type { ActionRun } from '@/core/entities/actionRun';
import type { EntityRef } from '@/core/entities/entityRef';
import { datasetChanges } from '@/core/processes/datasetChanges';

import type { ActionRepo, ExecuteActionInput } from '@/app/ports/repos/action';

import type { Command } from '../command';

export function createExecuteAction(
    repo: ActionRepo
): Command<ExecuteActionInput, ActionRun> {
    return {
        execute: input => repo.executeAction(input),
        writes: (input, output) => {
            const refs = new Set<EntityRef>(['actionRun', 'dashboard']);
            const datasets = new Set(output.changes.map(change => change.datasetId));

            for (const id of datasets) {
                for (const ref of datasetChanges(
                    `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(id)}`,
                    'content'
                )) {
                    refs.add(ref);
                }
            }

            return [...refs];
        },
    };
}
