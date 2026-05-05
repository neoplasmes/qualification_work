import { Router } from 'primitive-server';

import type { CreateOrgCommand, DeleteOrgCommand } from '@/core/commands';

import type { AppState } from '@/shared/appState';

import { createCreateOrgHandler } from './create.handler';
import { createDeleteOrgHandler } from './delete.handler';

export function createOrgsRouter(
    createOrg: CreateOrgCommand,
    deleteOrg: DeleteOrgCommand
): Router<AppState> {
    const router = new Router<AppState>('/orgs');

    router.post('/', createCreateOrgHandler(createOrg));
    router.delete('/:id', createDeleteOrgHandler(deleteOrg));

    return router;
}
