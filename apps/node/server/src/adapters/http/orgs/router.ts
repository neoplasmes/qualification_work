import { Router } from 'primitive-server';

import type { CreateOrgHandler, DeleteOrgHandler } from '@/core/commands';

import type { AppState } from '@/shared/appState';

import { createCreateOrgHandler } from './create';
import { createDeleteOrgHandler } from './delete';

export function createOrgsRouter(
    createOrg: CreateOrgHandler,
    deleteOrg: DeleteOrgHandler
): Router<AppState> {
    const router = new Router<AppState>('/orgs');

    router.post('/', createCreateOrgHandler(createOrg));
    router.delete('/:id', createDeleteOrgHandler(deleteOrg));

    return router;
}
