import { Router } from 'primitive-server';

import type {
    CreateChartCommand,
    DeleteChartCommand,
    UpdateChartCommand,
} from '@/core/commands';
import type {
    GetChartByIdQuery,
    GetChartDataQuery,
    GetChartsByOrgIdQuery,
} from '@/core/queries';

import type { AppState } from '@/shared/appState';

import { createCreateChartHandler } from './create.handler';
import { createDeleteChartHandler } from './delete.handler';
import { createGetChartByIdHandler } from './getById.handler';
import { createGetChartsByOrgIdHandler } from './getByOrgId.handler';
import { createGetChartDataHandler } from './getData.handler';
import { createUpdateChartHandler } from './update.handler';

export function createChartsRouter(
    createChartHandler: CreateChartCommand,
    updateChartHandler: UpdateChartCommand,
    deleteChartHandler: DeleteChartCommand,
    getChartByIdHandler: GetChartByIdQuery,
    getChartsByOrgIdHandler: GetChartsByOrgIdQuery,
    getChartDataHandler: GetChartDataQuery
): Router<AppState> {
    const router = new Router<AppState>('/charts');

    router.get('/', createGetChartsByOrgIdHandler(getChartsByOrgIdHandler));
    router.get('/:id', createGetChartByIdHandler(getChartByIdHandler));
    router.post('/', createCreateChartHandler(createChartHandler));
    router.put('/:id', createUpdateChartHandler(updateChartHandler));
    router.delete('/:id', createDeleteChartHandler(deleteChartHandler));

    // filterOverrides are base64-encoded JSON in ?filterOverrides= query param
    router.get('/:id/data', createGetChartDataHandler(getChartDataHandler));

    return router;
}
