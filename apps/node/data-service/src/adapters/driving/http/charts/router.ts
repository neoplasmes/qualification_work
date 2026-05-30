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
    PreviewChartDataQuery,
} from '@/core/queries';

import type { AppState } from '@/shared/appState';

import { createDeleteChartHandler } from './delete';
import {
    createGetChartByIdHandler,
    createGetChartDataHandler,
    createGetChartsByOrgIdHandler,
} from './get';
import { createPatchChartHandler } from './patch';
import { createCreateChartHandler, createPreviewChartDataHandler } from './post';
import { createUpdateChartHandler } from './put';

export function createChartsRouter(
    createChartHandler: CreateChartCommand,
    updateChartHandler: UpdateChartCommand,
    deleteChartHandler: DeleteChartCommand,
    getChartByIdHandler: GetChartByIdQuery,
    getChartsByOrgIdHandler: GetChartsByOrgIdQuery,
    getChartDataHandler: GetChartDataQuery,
    previewChartDataHandler: PreviewChartDataQuery
): Router<AppState> {
    const router = new Router<AppState>('/charts');

    router.get('/', createGetChartsByOrgIdHandler(getChartsByOrgIdHandler));
    router.post('/preview', createPreviewChartDataHandler(previewChartDataHandler));
    router.get('/:id', createGetChartByIdHandler(getChartByIdHandler));
    router.post('/', createCreateChartHandler(createChartHandler));
    router.patch('/:id', createPatchChartHandler(updateChartHandler));
    router.put('/:id', createUpdateChartHandler(updateChartHandler));
    router.delete('/:id', createDeleteChartHandler(deleteChartHandler));

    // filterOverrides are base64-encoded JSON in ?filterOverrides= query param
    router.get('/:id/data', createGetChartDataHandler(getChartDataHandler));

    return router;
}
