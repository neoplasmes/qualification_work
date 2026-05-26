import { chartsPageInitialState, type ChartsPageState } from './chartsPageSlice';

type ChartsPagePersisted = Pick<
    ChartsPageState,
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

export const chartsPagePersistence = {
    key: 'chartsPage_v1',
    fallbackState: {
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
    } satisfies ChartsPagePersisted,
    getInitialState: (persistedState: ChartsPagePersisted): ChartsPageState => ({
        ...chartsPageInitialState,
        ...persistedState,
        showDatasetPicker: false,
    }),
    pickPersistedState: (state: ChartsPageState): ChartsPagePersisted => ({
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
    }),
};
