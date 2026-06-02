import { combineReducers } from '@reduxjs/toolkit';

import { actionsPageSlice } from '@/pages/Actions';
import { chartsPageSlice } from '@/pages/Charts';
import { dashboardsPageSlice } from '@/pages/Dashboards';
import { datasetsPageSlice } from '@/pages/Datasets';

import { panelLayoutSlice } from '@/widgets/WorkspaceGrid';

import { filterApplicationEntitiesSlice } from '@/features/filterApplicationEntities';

import { api } from '@/shared/api';

import { resetAuthenticatedSessionState } from './sessionState';

const appReducer = combineReducers({
    [api.reducerPath]: api.reducer,
    [panelLayoutSlice.name]: panelLayoutSlice.reducer,
    [actionsPageSlice.name]: actionsPageSlice.reducer,
    [chartsPageSlice.name]: chartsPageSlice.reducer,
    [datasetsPageSlice.name]: datasetsPageSlice.reducer,
    [dashboardsPageSlice.name]: dashboardsPageSlice.reducer,
    [filterApplicationEntitiesSlice.name]: filterApplicationEntitiesSlice.reducer,
});

export type RootState = ReturnType<typeof appReducer>;

type RootReducerState = Parameters<typeof appReducer>[0];
type RootReducerAction = Parameters<typeof appReducer>[1];

export const rootReducer = (
    state: RootReducerState,
    action: RootReducerAction
): RootState => {
    if (resetAuthenticatedSessionState.match(action)) {
        const preservedState = state?.[panelLayoutSlice.name]
            ? { [panelLayoutSlice.name]: state[panelLayoutSlice.name] }
            : undefined;

        return appReducer(preservedState as RootReducerState, action);
    }

    return appReducer(state, action);
};
