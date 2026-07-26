import type { ActionRepo, PatchActionInput } from '@/app/ports/repos/action';

import type { Command } from '../command';

export function createPatchAction(repo: ActionRepo): Command<PatchActionInput, void> {
    return {
        execute: input => repo.patchAction(input),
        writes: input => [
            'action',
            `action:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.actionId)}`,
        ],
    };
}
