import { Router } from 'primitive-server';

import type {
    AddDashboardItemCommand,
    CreateDashboardCommand,
    DeleteDashboardCommand,
    DeleteDashboardItemCommand,
    RenameDashboardCommand,
    ReorderDashboardCommand,
    UpdateDashboardItemCommand,
} from '@/core/commands';
import type { GetDashboardQuery, ListDashboardsQuery } from '@/core/queries';

import type { AppState } from '@/shared/appState';

import { createDeleteDashboardHandler, createDeleteItemHandler } from './delete';
import { createGetDashboardHandler, createListDashboardsHandler } from './get';
import {
    createRenameDashboardHandler,
    createReorderItemsHandler,
    createUpdateItemHandler,
} from './patch';
import { createAddItemHandler, createCreateDashboardHandler } from './post';

export type DashboardsRouterDeps = {
    createDashboard: CreateDashboardCommand;
    deleteDashboard: DeleteDashboardCommand;
    renameDashboard: RenameDashboardCommand;
    addDashboardItem: AddDashboardItemCommand;
    deleteDashboardItem: DeleteDashboardItemCommand;
    updateDashboardItem: UpdateDashboardItemCommand;
    reorderDashboard: ReorderDashboardCommand;
    getDashboard: GetDashboardQuery;
    listDashboards: ListDashboardsQuery;
};

export function createDashboardsRouter(deps: DashboardsRouterDeps): Router<AppState> {
    const router = new Router<AppState>('/dashboards');

    router.post('/', createCreateDashboardHandler(deps.createDashboard));
    router.get('/', createListDashboardsHandler(deps.listDashboards));
    router.get('/:id', createGetDashboardHandler(deps.getDashboard));
    router.patch('/:id', createRenameDashboardHandler(deps.renameDashboard));
    router.delete('/:id', createDeleteDashboardHandler(deps.deleteDashboard));

    router.patch('/:id/items/order', createReorderItemsHandler(deps.reorderDashboard));
    router.post('/:id/items', createAddItemHandler(deps.addDashboardItem));
    router.patch('/:id/items/:itemId', createUpdateItemHandler(deps.updateDashboardItem));
    router.delete(
        '/:id/items/:itemId',
        createDeleteItemHandler(deps.deleteDashboardItem)
    );

    return router;
}
