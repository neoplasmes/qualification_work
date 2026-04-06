import type { AppState } from '@/common/appState';
import type { CreateOrgHandler, DeleteOrgHandler } from '@/core/commands';
import { Router } from 'primitive-server';

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
