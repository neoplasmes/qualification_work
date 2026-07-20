import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';

export type DatasetsPageState = {
    selectedDatasetId: string | null;
    showUpload: boolean;
    // per-dataset counter bumped when something external invalidates the preview
    // (e.g. merge commit). drives the DatasetWorkspace key so it fully remounts and
    // refetches rows without resetting on unrelated metadata changes like rename
    datasetReloadVersions: Record<string, number>;
};

export const datasetsPageInitialState: DatasetsPageState = {
    selectedDatasetId: null,
    showUpload: false,
    datasetReloadVersions: {},
};

export type DatasetsPageStateStore = DatasetsPageState & {
    selectDataset(value: string | null): void;
    setShowUpload(value: boolean): void;
    bumpDatasetReloadVersion(value: string): void;
};

export function createDatasetsPageStore(initial: Partial<DatasetsPageState> = {}) {
    return createStore<DatasetsPageStateStore>()(
        immer(set => ({
            ...datasetsPageInitialState,
            ...initial,
            selectDataset: value =>
                set(state => {
                    state.selectedDatasetId = value;
                }),
            setShowUpload: value =>
                set(state => {
                    state.showUpload = value;
                }),
            bumpDatasetReloadVersion: value =>
                set(state => {
                    const id = value;
                    state.datasetReloadVersions[id] =
                        (state.datasetReloadVersions[id] ?? 0) + 1;
                }),
        }))
    );
}
