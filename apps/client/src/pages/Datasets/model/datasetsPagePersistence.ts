import { datasetsPageInitialState, type DatasetsPageState } from './datasetsPageSlice';

type DatasetsPagePersisted = Pick<DatasetsPageState, 'selectedDatasetId'>;

export const datasetsPagePersistence = {
    key: 'datasetsPage_v1',
    fallbackState: {
        selectedDatasetId: null,
    } satisfies DatasetsPagePersisted,
    getInitialState: (persistedState: DatasetsPagePersisted): DatasetsPageState => ({
        ...datasetsPageInitialState,
        selectedDatasetId: persistedState.selectedDatasetId,
        showUpload: false,
    }),
    pickPersistedState: (state: DatasetsPageState): DatasetsPagePersisted => ({
        selectedDatasetId: state.selectedDatasetId,
    }),
};
