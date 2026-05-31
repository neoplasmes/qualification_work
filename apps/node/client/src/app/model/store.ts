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

import { api } from '@/shared/api';

import { rootReducer, type RootState } from './rootReducer';
import { getPersistedInitialState, subscribePersistedSlices } from './storePersistence';

export function createStore(preloadedState?: Partial<RootState>) {
    const persistedState = {
        [panelLayoutSlice.name]: getPersistedInitialState<
            PanelLayoutState,
            PanelLayoutState
        >(panelLayoutPersistence),
        [actionsPageSlice.name]: getPersistedInitialState<
            ActionsPageState,
            ReturnType<typeof actionsPagePersistence.pickPersistedState>
        >(actionsPagePersistence),
        [datasetsPageSlice.name]: getPersistedInitialState<
            DatasetsPageState,
            ReturnType<typeof datasetsPagePersistence.pickPersistedState>
        >(datasetsPagePersistence),
        [dashboardsPageSlice.name]: getPersistedInitialState<
            DashboardsPageState,
            ReturnType<typeof dashboardsPagePersistence.pickPersistedState>
        >(dashboardsPagePersistence),
        [filterApplicationEntitiesSlice.name]: getPersistedInitialState<
            FilterApplicationEntitiesState,
            ReturnType<typeof filterApplicationEntitiesPersistence.pickPersistedState>
        >(filterApplicationEntitiesPersistence),
    };

    const store = configureStore({
        reducer: rootReducer,
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(api.middleware),
        preloadedState: {
            ...preloadedState,
            ...persistedState,
        },
    });

    subscribePersistedSlices(store, [
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
