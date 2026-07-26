import type { ActionRun } from '@/core/entities/actionRun';

import type { ActionRepo, ListRunsInput } from '@/app/ports/repos/action';

import type { Query } from '../query';

export function createListActionRuns(
    repo: ActionRepo
): Query<ListRunsInput, ActionRun[]> {
    return {
        name: 'listActionRuns',
        execute: (input, options) => repo.listActionRuns(input, options),
        reads: () => ['actionRun'],
    };
}
