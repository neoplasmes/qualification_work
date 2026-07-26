import type { Action } from '@/core/entities/action';

import type { ActionRepo, ListActionsInput } from '@/app/ports/repos/action';

import type { Query } from '../query';

export function createListActions(repo: ActionRepo): Query<ListActionsInput, Action[]> {
    return {
        name: 'listActions',
        execute: (input, options) => repo.listActions(input, options),
        reads: () => ['action'],
    };
}
