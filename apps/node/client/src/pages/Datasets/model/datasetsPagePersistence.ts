import { datasetsPageInitialState, type DatasetsPageState } from './datasetsPageSlice';

type DatasetsPagePersisted = Pick<
    DatasetsPageState,
    | 'selectedDatasetId'
    | 'filterChartIds'
    | 'filterDashboardIds'
    | 'datasetsFilterActiveTab'
>;

export const datasetsPagePersistence = {
    key: 'datasetsPage_v1',
    fallbackState: {
        selectedDatasetId: null,
        filterChartIds: [],
        filterDashboardIds: [],
        datasetsFilterActiveTab: 'charts',
    } satisfies DatasetsPagePersisted,
    getInitialState: (persistedState: DatasetsPagePersisted): DatasetsPageState => ({
        ...datasetsPageInitialState,
        ...persistedState,
        showUpload: false,
    }),
    pickPersistedState: (state: DatasetsPageState): DatasetsPagePersisted => ({
        selectedDatasetId: state.selectedDatasetId,
        filterChartIds: state.filterChartIds,
        filterDashboardIds: state.filterDashboardIds,
        datasetsFilterActiveTab: state.datasetsFilterActiveTab,
    }),
};
