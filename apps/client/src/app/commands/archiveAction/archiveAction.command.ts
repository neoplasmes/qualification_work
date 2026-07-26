import type { ActionRepo, ActionScope } from '@/app/ports/repos/action';

import type { Command } from '../command';

export function createArchiveAction(repo: ActionRepo): Command<ActionScope, void> {
    return {
        execute: input => repo.archiveAction(input),
        writes: input => [
            'action',
            `action:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.actionId)}`,
        ],
    };
}
