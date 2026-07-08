import { Router } from 'primitive-server';

import type {
    AddDashboardItemCommand,
    CreateDashboardCommand,
    DeleteDashboardCommand,
    DeleteDashboardItemCommand,
    RenameDashboardCommand,
    UpdateDashboardItemCommand,
    UpdateDashboardLayoutCommand,
} from '@/core/commands';
import type {
    GetDashboardQuery,
    ListDashboardsQuery,
    PreviewDashboardMetricQuery,
} from '@/core/queries';

import type { AppState } from '@/shared/appState';

import { createDeleteDashboardHandler, createDeleteItemHandler } from './delete';
import { createGetDashboardHandler, createListDashboardsHandler } from './get';
import {
    createRenameDashboardHandler,
    createUpdateItemHandler,
    createUpdateItemsLayoutHandler,
} from './patch';
import {
    createAddItemHandler,
    createCreateDashboardHandler,
    createPreviewMetricHandler,
} from './post';

export type DashboardsRouterDeps = {
    createDashboard: CreateDashboardCommand;
    deleteDashboard: DeleteDashboardCommand;
    renameDashboard: RenameDashboardCommand;
    addDashboardItem: AddDashboardItemCommand;
    deleteDashboardItem: DeleteDashboardItemCommand;
    updateDashboardItem: UpdateDashboardItemCommand;
    updateDashboardLayout: UpdateDashboardLayoutCommand;
    getDashboard: GetDashboardQuery;
    listDashboards: ListDashboardsQuery;
    previewDashboardMetric: PreviewDashboardMetricQuery;
};

export function createDashboardsRouter(deps: DashboardsRouterDeps): Router<AppState> {
    const router = new Router<AppState>('/dashboards');

    router.post('/', createCreateDashboardHandler(deps.createDashboard));
    router.post(
        '/metrics/preview',
        createPreviewMetricHandler(deps.previewDashboardMetric)
    );
    router.get('/', createListDashboardsHandler(deps.listDashboards));
    router.get('/:id', createGetDashboardHandler(deps.getDashboard));
    router.patch('/:id', createRenameDashboardHandler(deps.renameDashboard));
    router.delete('/:id', createDeleteDashboardHandler(deps.deleteDashboard));

    router.patch(
        '/:id/items/layout',
        createUpdateItemsLayoutHandler(deps.updateDashboardLayout)
    );
    router.post('/:id/items', createAddItemHandler(deps.addDashboardItem));
    router.patch('/:id/items/:itemId', createUpdateItemHandler(deps.updateDashboardItem));
    router.delete(
        '/:id/items/:itemId',
        createDeleteItemHandler(deps.deleteDashboardItem)
    );

    return router;
}
