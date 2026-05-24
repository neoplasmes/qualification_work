import { Router } from 'primitive-server';

import type {
    ArchiveActionCommand,
    CreateActionCommand,
    ExecuteActionCommand,
    PatchActionCommand,
    UpdateActionCommand,
} from '@/core/commands';
import type {
    GetActionByIdQuery,
    GetActionsByOrgIdQuery,
    ListActionRunsQuery,
} from '@/core/queries';

import type { AppState } from '@/shared/appState';

import { createArchiveActionHandler } from './archive.handler';
import { createCreateActionHandler } from './create.handler';
import { createExecuteActionHandler } from './execute.handler';
import { createGetActionByIdHandler } from './getById.handler';
import { createGetActionsByOrgIdHandler } from './getByOrgId.handler';
import {
    createListActionRunsHandler,
    createListOrgActionRunsHandler,
} from './listRuns.handler';
import { createPatchActionHandler } from './patch.handler';
import { createUpdateActionHandler } from './update.handler';

export type ActionsRouterDeps = {
    createActionHandler: CreateActionCommand;
    updateActionHandler: UpdateActionCommand;
    archiveActionHandler: ArchiveActionCommand;
    executeActionHandler: ExecuteActionCommand;
    patchActionHandler: PatchActionCommand;
    getActionByIdHandler: GetActionByIdQuery;
    getActionsByOrgIdHandler: GetActionsByOrgIdQuery;
    listActionRunsHandler: ListActionRunsQuery;
};

export function createActionsRouter(deps: ActionsRouterDeps): Router<AppState> {
    const router = new Router<AppState>('/actions');

    router.get('/runs', createListOrgActionRunsHandler(deps.listActionRunsHandler));
    router.get('/', createGetActionsByOrgIdHandler(deps.getActionsByOrgIdHandler));
    router.post('/', createCreateActionHandler(deps.createActionHandler));
    router.get('/:id/runs', createListActionRunsHandler(deps.listActionRunsHandler));
    router.post('/:id/runs', createExecuteActionHandler(deps.executeActionHandler));
    router.get('/:id', createGetActionByIdHandler(deps.getActionByIdHandler));
    router.patch('/:id', createPatchActionHandler(deps.patchActionHandler));
    router.put('/:id', createUpdateActionHandler(deps.updateActionHandler));
    router.delete('/:id', createArchiveActionHandler(deps.archiveActionHandler));

    return router;
}
