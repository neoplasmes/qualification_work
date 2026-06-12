import { configureStore } from '@reduxjs/toolkit';

import {
    actionsPagePersistence,
    actionsPageSlice,
    type ActionsPageState,
} from '@/pages/Actions';
import {
    dashboardsPagePersistence,
    dashboardsPageSlice,
    type DashboardsPageState,
} from '@/pages/Dashboards';
import {
    datasetsPagePersistence,
    datasetsPageSlice,
    type DatasetsPageState,
} from '@/pages/Datasets';

import {
    panelLayoutPersistence,
    panelLayoutSlice,
    type PanelLayoutState,
} from '@/widgets/WorkspaceGrid';

import {
    filterApplicationEntitiesPersistence,
    filterApplicationEntitiesSlice,
    type FilterApplicationEntitiesState,
} from '@/features/filterApplicationEntities';

import { api, type ApiExtraArgument } from '@/shared/api';

import { persistentStateStorage } from '../persistence/persistentState';
import { rootReducer, type RootState } from './reducer';

export type CreateStoreOptions = {
    apiExtraArgument?: ApiExtraArgument;
};

export const getPersistedState = (): Partial<RootState> => ({
    [panelLayoutSlice.name]: persistentStateStorage.getInitialState<
        PanelLayoutState,
        PanelLayoutState
    >(panelLayoutPersistence),
    [actionsPageSlice.name]: persistentStateStorage.getInitialState<
        ActionsPageState,
        ReturnType<typeof actionsPagePersistence.pickPersistedState>
    >(actionsPagePersistence),
    [datasetsPageSlice.name]: persistentStateStorage.getInitialState<
        DatasetsPageState,
        ReturnType<typeof datasetsPagePersistence.pickPersistedState>
    >(datasetsPagePersistence),
    [dashboardsPageSlice.name]: persistentStateStorage.getInitialState<
        DashboardsPageState,
        ReturnType<typeof dashboardsPagePersistence.pickPersistedState>
    >(dashboardsPagePersistence),
    [filterApplicationEntitiesSlice.name]: persistentStateStorage.getInitialState<
        FilterApplicationEntitiesState,
        ReturnType<typeof filterApplicationEntitiesPersistence.pickPersistedState>
    >(filterApplicationEntitiesPersistence),
});

export function createStore(
    preloadedState?: Partial<RootState>,
    options: CreateStoreOptions = {}
) {
    const store = configureStore({
        reducer: rootReducer,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: options.apiExtraArgument ?? {},
                },
            }).concat(api.middleware),
        preloadedState,
    });

    persistentStateStorage.subscribeSlices(store, [
        {
            key: panelLayoutPersistence.key,
            selectPersistedState: state =>
                panelLayoutPersistence.pickPersistedState(state[panelLayoutSlice.name]),
        },
        {
            key: actionsPagePersistence.key,
            selectPersistedState: state =>
                actionsPagePersistence.pickPersistedState(state[actionsPageSlice.name]),
        },
        {
            key: datasetsPagePersistence.key,
            selectPersistedState: state =>
                datasetsPagePersistence.pickPersistedState(state[datasetsPageSlice.name]),
        },
        {
            key: dashboardsPagePersistence.key,
            selectPersistedState: state =>
                dashboardsPagePersistence.pickPersistedState(
                    state[dashboardsPageSlice.name]
                ),
        },
        {
            key: filterApplicationEntitiesPersistence.key,
            selectPersistedState: state =>
                filterApplicationEntitiesPersistence.pickPersistedState(
                    state[filterApplicationEntitiesSlice.name]
                ),
        },
    ]);

    return store;
}

export type { RootState };
export type AppStore = ReturnType<typeof createStore>;
export type AppDispatch = AppStore['dispatch'];
