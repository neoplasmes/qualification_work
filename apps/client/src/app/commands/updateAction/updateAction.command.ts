import type { ActionRepo, UpdateActionInput } from '@/app/ports/repos/action';

import type { Command } from '../command';

export function createUpdateAction(repo: ActionRepo): Command<UpdateActionInput, void> {
    return {
        execute: input => repo.updateAction(input),
        writes: input => [
            'action',
            `action:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.actionId)}`,
        ],
    };
}
