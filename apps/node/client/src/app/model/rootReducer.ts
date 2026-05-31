import { combineReducers } from '@reduxjs/toolkit';

import { actionsPageSlice } from '@/pages/Actions';
import { chartsPageSlice } from '@/pages/Charts';
import { dashboardsPageSlice } from '@/pages/Dashboards';
import { datasetsPageSlice } from '@/pages/Datasets';

import { panelLayoutSlice } from '@/widgets/WorkspaceGrid';

import { filterApplicationEntitiesSlice } from '@/features/filterApplicationEntities';

import { api } from '@/shared/api';

export const rootReducer = combineReducers({
    [api.reducerPath]: api.reducer,
    [panelLayoutSlice.name]: panelLayoutSlice.reducer,
    [actionsPageSlice.name]: actionsPageSlice.reducer,
    [chartsPageSlice.name]: chartsPageSlice.reducer,
    [datasetsPageSlice.name]: datasetsPageSlice.reducer,
    [dashboardsPageSlice.name]: dashboardsPageSlice.reducer,
    [filterApplicationEntitiesSlice.name]: filterApplicationEntitiesSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
