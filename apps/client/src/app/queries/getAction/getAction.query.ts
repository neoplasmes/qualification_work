import type { Action } from '@/core/entities/action';

import type { ActionRepo, ActionScope } from '@/app/ports/repos/action';

import type { Query } from '../query';

export function createGetAction(repo: ActionRepo): Query<ActionScope, Action> {
    return {
        name: 'getAction',
        execute: (input, options) => repo.getAction(input, options),
        reads: input => [
            `action:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.actionId)}`,
        ],
    };
}
