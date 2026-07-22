import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';

export type DatasetsPageState = {
    selectedDatasetId: string | null;
    showUpload: boolean;
};

export const datasetsPageInitialState: DatasetsPageState = {
    selectedDatasetId: null,
    showUpload: false,
};

export type DatasetsPageStateStore = DatasetsPageState & {
    selectDataset(value: string | null): void;
    setShowUpload(value: boolean): void;
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
        }))
    );
}

// external content changes (for example merge commit) invalidate active reads
// rows and columns refresh without remounting or resetting on a metadata rename
