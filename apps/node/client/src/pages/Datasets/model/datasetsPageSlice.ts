import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type DatasetsPageState = {
    selectedDatasetId: string | null;
    showUpload: boolean;
    filterChartIds: string[];
    filterDashboardIds: string[];
    datasetsFilterActiveTab: 'charts' | 'dashboards';
    // per-dataset counter bumped when something external invalidates the preview
    // (e.g. merge commit). drives the DatasetPreview key so it fully remounts and
    // refetches rows without resetting on unrelated metadata changes like rename
    datasetReloadVersions: Record<string, number>;
};

type StateWithDatasetsPage = { datasetsPage: DatasetsPageState };

export const datasetsPageInitialState: DatasetsPageState = {
    selectedDatasetId: null,
    showUpload: false,
    filterChartIds: [],
    filterDashboardIds: [],
    datasetsFilterActiveTab: 'charts',
    datasetReloadVersions: {},
};

export const datasetsPageSlice = createSlice({
    name: 'datasetsPage',
    initialState: datasetsPageInitialState,
    reducers: {
        selectDataset(state, action: PayloadAction<string | null>) {
            state.selectedDatasetId = action.payload;
        },
        setShowUpload(state, action: PayloadAction<boolean>) {
            state.showUpload = action.payload;
        },
        toggleChartFilter(state, action: PayloadAction<string>) {
            const id = action.payload;
            const idx = state.filterChartIds.indexOf(id);
            if (idx >= 0) {
                state.filterChartIds.splice(idx, 1);
            } else {
                state.filterChartIds.push(id);
            }
        },
        toggleDashboardFilter(state, action: PayloadAction<string>) {
            const id = action.payload;
            const idx = state.filterDashboardIds.indexOf(id);
            if (idx >= 0) {
                state.filterDashboardIds.splice(idx, 1);
            } else {
                state.filterDashboardIds.push(id);
            }
        },
        clearChartFilter(state) {
            state.filterChartIds = [];
        },
        clearDashboardFilter(state) {
            state.filterDashboardIds = [];
        },
        setDatasetsFilterActiveTab(
            state,
            action: PayloadAction<'charts' | 'dashboards'>
        ) {
            state.datasetsFilterActiveTab = action.payload;
        },
        bumpDatasetReloadVersion(state, action: PayloadAction<string>) {
            const id = action.payload;
            state.datasetReloadVersions[id] = (state.datasetReloadVersions[id] ?? 0) + 1;
        },
    },
});

export const {
    selectDataset,
    setShowUpload,
    toggleChartFilter,
    toggleDashboardFilter,
    clearChartFilter,
    clearDashboardFilter,
    setDatasetsFilterActiveTab,
    bumpDatasetReloadVersion,
} = datasetsPageSlice.actions;

export const selectSelectedDatasetId = (state: StateWithDatasetsPage) =>
    state.datasetsPage.selectedDatasetId;
export const selectShowUpload = (state: StateWithDatasetsPage) =>
    state.datasetsPage.showUpload;
export const selectFilterChartIds = (state: StateWithDatasetsPage) =>
    state.datasetsPage.filterChartIds;
export const selectFilterDashboardIds = (state: StateWithDatasetsPage) =>
    state.datasetsPage.filterDashboardIds;
export const selectDatasetsFilterActiveTab = (state: StateWithDatasetsPage) =>
    state.datasetsPage.datasetsFilterActiveTab;
export const selectDatasetReloadVersion =
    (datasetId: string | null) => (state: StateWithDatasetsPage) =>
        datasetId === null
            ? 0
            : (state.datasetsPage.datasetReloadVersions[datasetId] ?? 0);
