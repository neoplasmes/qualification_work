import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { panelLayoutSlice, type PanelLayoutState } from '@/widgets/WorkspaceGrid';

import { actionsPageSlice, actionsPageInitialState } from '@/pages/Actions';
import { chartsPageSlice, chartsPageInitialState } from '@/pages/Charts';
import { datasetsPageSlice, datasetsPageInitialState } from '@/pages/Datasets';
import { dashboardsPageSlice, dashboardsPageInitialState } from '@/pages/Dashboards';

import { api } from '@/shared/api';

const LS_PANEL_LAYOUT_KEY = 'panelLayout_v2';
const LS_ACTIONS_PAGE_KEY = 'actionsPage_v1';
const LS_CHARTS_PAGE_KEY = 'chartsPage_v1';
const LS_DATASETS_PAGE_KEY = 'datasetsPage_v1';
const LS_DASHBOARDS_PAGE_KEY = 'dashboardsPage_v1';

const loadPanelLayout = (): PanelLayoutState => {
    try {
        const raw = localStorage.getItem(LS_PANEL_LAYOUT_KEY);

        return raw
            ? (JSON.parse(raw) as PanelLayoutState)
            : { sizes: {}, isLeftCollapsed: false, isRightCollapsed: false };
    } catch {
        return { sizes: {}, isLeftCollapsed: false, isRightCollapsed: false };
    }
};

type ChartsPagePersisted = Pick<
    typeof chartsPageInitialState,
    | 'selectedChartId'
    | 'filterDatasetIds'
    | 'filterDashboardIds'
    | 'builderDatasetId'
    | 'chartsFilterActiveTab'
    | 'workspaceDraftChartId'
    | 'workspaceDraftName'
    | 'workspaceDraftChartType'
    | 'workspaceDraftConfigText'
    | 'workspaceFilterOverrideText'
>;

type ActionsPagePersisted = Pick<
    typeof actionsPageInitialState,
    | 'selectedActionId'
    | 'workspaceTab'
    | 'rightPanelTab'
    | 'filtersTab'
    | 'searchText'
    | 'filterDatasetIds'
    | 'filterEffectKinds'
    | 'filterRunStatuses'
>;

type DatasetsPagePersisted = Pick<
    typeof datasetsPageInitialState,
    'selectedDatasetId' | 'filterChartIds' | 'filterDashboardIds' | 'datasetsFilterActiveTab'
>;

type DashboardsPagePersisted = Pick<
    typeof dashboardsPageInitialState,
    | 'selectedDashboardId'
    | 'filterChartIds'
    | 'filterDatasetIds'
    | 'dashboardsFilterActiveTab'
    | 'workspaceDraftDashboardId'
    | 'workspaceDraftName'
    | 'workspaceMetricName'
    | 'workspaceMetricExpression'
    | 'workspaceMetricFormat'
>;

const loadChartsPage = (): ChartsPagePersisted => {
    try {
        const raw = localStorage.getItem(LS_CHARTS_PAGE_KEY);

        return raw
            ? (JSON.parse(raw) as ChartsPagePersisted)
            : {
                  selectedChartId: null,
                  filterDatasetIds: [],
                  filterDashboardIds: [],
                  builderDatasetId: null,
                  chartsFilterActiveTab: 'datasets',
                  workspaceDraftChartId: null,
                  workspaceDraftName: '',
                  workspaceDraftChartType: 'bar',
                  workspaceDraftConfigText: '',
                  workspaceFilterOverrideText: '',
              };
    } catch {
        return {
            selectedChartId: null,
            filterDatasetIds: [],
            filterDashboardIds: [],
            builderDatasetId: null,
            chartsFilterActiveTab: 'datasets',
            workspaceDraftChartId: null,
            workspaceDraftName: '',
            workspaceDraftChartType: 'bar',
            workspaceDraftConfigText: '',
            workspaceFilterOverrideText: '',
        };
    }
};

const loadActionsPage = (): ActionsPagePersisted => {
    try {
        const raw = localStorage.getItem(LS_ACTIONS_PAGE_KEY);

        return raw
            ? (JSON.parse(raw) as ActionsPagePersisted)
            : {
                  selectedActionId: null,
                  workspaceTab: 'configure',
                  rightPanelTab: 'history',
                  filtersTab: 'datasets',
                  searchText: '',
                  filterDatasetIds: [],
                  filterEffectKinds: [],
                  filterRunStatuses: [],
              };
    } catch {
        return {
            selectedActionId: null,
            workspaceTab: 'configure',
            rightPanelTab: 'history',
            filtersTab: 'datasets',
            searchText: '',
            filterDatasetIds: [],
            filterEffectKinds: [],
            filterRunStatuses: [],
        };
    }
};

const loadDatasetsPage = (): DatasetsPagePersisted => {
    try {
        const raw = localStorage.getItem(LS_DATASETS_PAGE_KEY);

        return raw
            ? (JSON.parse(raw) as DatasetsPagePersisted)
            : {
                  selectedDatasetId: null,
                  filterChartIds: [],
                  filterDashboardIds: [],
                  datasetsFilterActiveTab: 'charts',
              };
    } catch {
        return {
            selectedDatasetId: null,
            filterChartIds: [],
            filterDashboardIds: [],
            datasetsFilterActiveTab: 'charts',
        };
    }
};

const loadDashboardsPage = (): DashboardsPagePersisted => {
    try {
        const raw = localStorage.getItem(LS_DASHBOARDS_PAGE_KEY);

        return raw
            ? (JSON.parse(raw) as DashboardsPagePersisted)
            : {
                  selectedDashboardId: null,
                  filterChartIds: [],
                  filterDatasetIds: [],
                  dashboardsFilterActiveTab: 'charts',
                  workspaceDraftDashboardId: null,
                  workspaceDraftName: '',
                  workspaceMetricName: '',
                  workspaceMetricExpression: '',
                  workspaceMetricFormat: 'number',
              };
    } catch {
        return {
            selectedDashboardId: null,
            filterChartIds: [],
            filterDatasetIds: [],
            dashboardsFilterActiveTab: 'charts',
            workspaceDraftDashboardId: null,
            workspaceDraftName: '',
            workspaceMetricName: '',
            workspaceMetricExpression: '',
            workspaceMetricFormat: 'number',
        };
    }
};

const pickChartsPagePersisted = (state: typeof chartsPageInitialState): ChartsPagePersisted => ({
    selectedChartId: state.selectedChartId,
    filterDatasetIds: state.filterDatasetIds,
    filterDashboardIds: state.filterDashboardIds,
    builderDatasetId: state.builderDatasetId,
    chartsFilterActiveTab: state.chartsFilterActiveTab,
    workspaceDraftChartId: state.workspaceDraftChartId,
    workspaceDraftName: state.workspaceDraftName,
    workspaceDraftChartType: state.workspaceDraftChartType,
    workspaceDraftConfigText: state.workspaceDraftConfigText,
    workspaceFilterOverrideText: state.workspaceFilterOverrideText,
});

const pickActionsPagePersisted = (
    state: typeof actionsPageInitialState
): ActionsPagePersisted => ({
    selectedActionId: state.selectedActionId,
    workspaceTab: state.workspaceTab,
    rightPanelTab: state.rightPanelTab,
    filtersTab: state.filtersTab,
    searchText: state.searchText,
    filterDatasetIds: state.filterDatasetIds,
    filterEffectKinds: state.filterEffectKinds,
    filterRunStatuses: state.filterRunStatuses,
});

const pickDatasetsPagePersisted = (
    state: typeof datasetsPageInitialState
): DatasetsPagePersisted => ({
    selectedDatasetId: state.selectedDatasetId,
    filterChartIds: state.filterChartIds,
    filterDashboardIds: state.filterDashboardIds,
    datasetsFilterActiveTab: state.datasetsFilterActiveTab,
});

const pickDashboardsPagePersisted = (
    state: typeof dashboardsPageInitialState
): DashboardsPagePersisted => ({
    selectedDashboardId: state.selectedDashboardId,
    filterChartIds: state.filterChartIds,
    filterDatasetIds: state.filterDatasetIds,
    dashboardsFilterActiveTab: state.dashboardsFilterActiveTab,
    workspaceDraftDashboardId: state.workspaceDraftDashboardId,
    workspaceDraftName: state.workspaceDraftName,
    workspaceMetricName: state.workspaceMetricName,
    workspaceMetricExpression: state.workspaceMetricExpression,
    workspaceMetricFormat: state.workspaceMetricFormat,
});

const rootReducer = combineReducers({
    [api.reducerPath]: api.reducer,
    [panelLayoutSlice.name]: panelLayoutSlice.reducer,
    [actionsPageSlice.name]: actionsPageSlice.reducer,
    [chartsPageSlice.name]: chartsPageSlice.reducer,
    [datasetsPageSlice.name]: datasetsPageSlice.reducer,
    [dashboardsPageSlice.name]: dashboardsPageSlice.reducer,
});

export function createStore(preloadedState?: Partial<RootState>) {
    const store = configureStore({
        reducer: rootReducer,
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(api.middleware),
        preloadedState: {
            [panelLayoutSlice.name]: loadPanelLayout(),
            [actionsPageSlice.name]: {
                ...actionsPageInitialState,
                ...loadActionsPage(),
                isCreatingAction: false,
            },
            [chartsPageSlice.name]: {
                ...chartsPageInitialState,
                ...loadChartsPage(),
                showDatasetPicker: false,
            },
            [datasetsPageSlice.name]: {
                ...datasetsPageInitialState,
                ...loadDatasetsPage(),
                showUpload: false,
            },
            [dashboardsPageSlice.name]: {
                ...dashboardsPageInitialState,
                ...loadDashboardsPage(),
            },
            ...preloadedState,
        },
    });

    let prevPanelLayout = store.getState()[panelLayoutSlice.name];
    let prevActionsPage = pickActionsPagePersisted(store.getState()[actionsPageSlice.name]);
    let prevChartsPage = pickChartsPagePersisted(store.getState()[chartsPageSlice.name]);
    let prevDatasetsPage = pickDatasetsPagePersisted(store.getState()[datasetsPageSlice.name]);
    let prevDashboardsPage = pickDashboardsPagePersisted(
        store.getState()[dashboardsPageSlice.name]
    );

    store.subscribe(() => {
        const state = store.getState();

        const nextPanelLayout = state[panelLayoutSlice.name];
        if (nextPanelLayout !== prevPanelLayout) {
            prevPanelLayout = nextPanelLayout;
            try {
                localStorage.setItem(LS_PANEL_LAYOUT_KEY, JSON.stringify(nextPanelLayout));
            } catch {
                // ignore storage quota errors
            }
        }

        const nextChartsPage = pickChartsPagePersisted(state[chartsPageSlice.name]);
        const nextActionsPage = pickActionsPagePersisted(state[actionsPageSlice.name]);
        if (
            nextActionsPage.selectedActionId !== prevActionsPage.selectedActionId ||
            nextActionsPage.workspaceTab !== prevActionsPage.workspaceTab ||
            nextActionsPage.rightPanelTab !== prevActionsPage.rightPanelTab ||
            nextActionsPage.filtersTab !== prevActionsPage.filtersTab ||
            nextActionsPage.searchText !== prevActionsPage.searchText ||
            nextActionsPage.filterDatasetIds !== prevActionsPage.filterDatasetIds ||
            nextActionsPage.filterEffectKinds !== prevActionsPage.filterEffectKinds ||
            nextActionsPage.filterRunStatuses !== prevActionsPage.filterRunStatuses
        ) {
            prevActionsPage = nextActionsPage;
            try {
                localStorage.setItem(LS_ACTIONS_PAGE_KEY, JSON.stringify(nextActionsPage));
            } catch {
                // ignore storage quota errors
            }
        }

        if (
            nextChartsPage.selectedChartId !== prevChartsPage.selectedChartId ||
            nextChartsPage.filterDatasetIds !== prevChartsPage.filterDatasetIds ||
            nextChartsPage.filterDashboardIds !== prevChartsPage.filterDashboardIds ||
            nextChartsPage.builderDatasetId !== prevChartsPage.builderDatasetId ||
            nextChartsPage.chartsFilterActiveTab !== prevChartsPage.chartsFilterActiveTab ||
            nextChartsPage.workspaceDraftChartId !== prevChartsPage.workspaceDraftChartId ||
            nextChartsPage.workspaceDraftName !== prevChartsPage.workspaceDraftName ||
            nextChartsPage.workspaceDraftChartType !== prevChartsPage.workspaceDraftChartType ||
            nextChartsPage.workspaceDraftConfigText !== prevChartsPage.workspaceDraftConfigText ||
            nextChartsPage.workspaceFilterOverrideText !==
                prevChartsPage.workspaceFilterOverrideText
        ) {
            prevChartsPage = nextChartsPage;
            try {
                localStorage.setItem(LS_CHARTS_PAGE_KEY, JSON.stringify(nextChartsPage));
            } catch {
                // ignore storage quota errors
            }
        }

        const nextDatasetsPage = pickDatasetsPagePersisted(state[datasetsPageSlice.name]);
        if (
            nextDatasetsPage.selectedDatasetId !== prevDatasetsPage.selectedDatasetId ||
            nextDatasetsPage.filterChartIds !== prevDatasetsPage.filterChartIds ||
            nextDatasetsPage.filterDashboardIds !== prevDatasetsPage.filterDashboardIds ||
            nextDatasetsPage.datasetsFilterActiveTab !== prevDatasetsPage.datasetsFilterActiveTab
        ) {
            prevDatasetsPage = nextDatasetsPage;
            try {
                localStorage.setItem(LS_DATASETS_PAGE_KEY, JSON.stringify(nextDatasetsPage));
            } catch {
                // ignore storage quota errors
            }
        }

        const nextDashboardsPage = pickDashboardsPagePersisted(
            state[dashboardsPageSlice.name]
        );
        if (
            nextDashboardsPage.selectedDashboardId !== prevDashboardsPage.selectedDashboardId ||
            nextDashboardsPage.filterChartIds !== prevDashboardsPage.filterChartIds ||
            nextDashboardsPage.filterDatasetIds !== prevDashboardsPage.filterDatasetIds ||
            nextDashboardsPage.dashboardsFilterActiveTab !==
                prevDashboardsPage.dashboardsFilterActiveTab ||
            nextDashboardsPage.workspaceDraftDashboardId !==
                prevDashboardsPage.workspaceDraftDashboardId ||
            nextDashboardsPage.workspaceDraftName !== prevDashboardsPage.workspaceDraftName ||
            nextDashboardsPage.workspaceMetricName !== prevDashboardsPage.workspaceMetricName ||
            nextDashboardsPage.workspaceMetricExpression !==
                prevDashboardsPage.workspaceMetricExpression ||
            nextDashboardsPage.workspaceMetricFormat !== prevDashboardsPage.workspaceMetricFormat
        ) {
            prevDashboardsPage = nextDashboardsPage;
            try {
                localStorage.setItem(
                    LS_DASHBOARDS_PAGE_KEY,
                    JSON.stringify(nextDashboardsPage)
                );
            } catch {
                // ignore storage quota errors
            }
        }
    });

    return store;
}

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof createStore>;
export type AppDispatch = AppStore['dispatch'];
