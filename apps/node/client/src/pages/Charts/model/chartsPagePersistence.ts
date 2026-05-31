import { chartsPageInitialState, type ChartsPageState } from './chartsPageSlice';

type ChartsPagePersisted = Pick<
    ChartsPageState,
    | 'selectedChartId'
    | 'builderDatasetId'
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
        builderDatasetId: null,
        workspaceDraftChartId: null,
        workspaceDraftName: '',
        workspaceDraftChartType: 'bar',
        workspaceDraftConfigText: '',
        workspaceFilterOverrideText: '',
    } satisfies ChartsPagePersisted,
    getInitialState: (persistedState: ChartsPagePersisted): ChartsPageState => ({
        ...chartsPageInitialState,
        selectedChartId: persistedState.selectedChartId,
        builderDatasetId: persistedState.builderDatasetId,
        workspaceDraftChartId: persistedState.workspaceDraftChartId,
        workspaceDraftName: persistedState.workspaceDraftName,
        workspaceDraftChartType: persistedState.workspaceDraftChartType,
        workspaceDraftConfigText: persistedState.workspaceDraftConfigText,
        workspaceFilterOverrideText: persistedState.workspaceFilterOverrideText,
        showDatasetPicker: false,
    }),
    pickPersistedState: (state: ChartsPageState): ChartsPagePersisted => ({
        selectedChartId: state.selectedChartId,
        builderDatasetId: state.builderDatasetId,
        workspaceDraftChartId: state.workspaceDraftChartId,
        workspaceDraftName: state.workspaceDraftName,
        workspaceDraftChartType: state.workspaceDraftChartType,
        workspaceDraftConfigText: state.workspaceDraftConfigText,
        workspaceFilterOverrideText: state.workspaceFilterOverrideText,
    }),
};
