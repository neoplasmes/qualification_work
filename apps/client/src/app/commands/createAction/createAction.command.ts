import type { ActionRepo, CreateActionInput } from '@/app/ports/repos/action';

import type { Command } from '../command';

export function createCreateAction(
    repo: ActionRepo
): Command<CreateActionInput, { id: string }> {
    return {
        execute: input => repo.createAction(input),
        writes: (input, output) => [
            'action',
            `action:${encodeURIComponent(input.orgId)}/${encodeURIComponent(output.id)}`,
        ],
    };
}
