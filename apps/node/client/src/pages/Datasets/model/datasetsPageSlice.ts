import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type DatasetsPageState = {
    selectedDatasetId: string | null;
    showUpload: boolean;
    // per-dataset counter bumped when something external invalidates the preview
    // (e.g. merge commit). drives the DatasetPreview key so it fully remounts and
    // refetches rows without resetting on unrelated metadata changes like rename
    datasetReloadVersions: Record<string, number>;
};

type StateWithDatasetsPage = { datasetsPage: DatasetsPageState };

export const datasetsPageInitialState: DatasetsPageState = {
    selectedDatasetId: null,
    showUpload: false,
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
        bumpDatasetReloadVersion(state, action: PayloadAction<string>) {
            const id = action.payload;
            state.datasetReloadVersions[id] = (state.datasetReloadVersions[id] ?? 0) + 1;
        },
    },
});

export const { selectDataset, setShowUpload, bumpDatasetReloadVersion } =
    datasetsPageSlice.actions;

export const selectSelectedDatasetId = (state: StateWithDatasetsPage) =>
    state.datasetsPage.selectedDatasetId;
export const selectShowUpload = (state: StateWithDatasetsPage) =>
    state.datasetsPage.showUpload;
export const selectDatasetReloadVersion =
    (datasetId: string | null) => (state: StateWithDatasetsPage) =>
        datasetId === null
            ? 0
            : (state.datasetsPage.datasetReloadVersions[datasetId] ?? 0);
