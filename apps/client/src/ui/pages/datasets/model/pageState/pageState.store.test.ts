import { describe, expect, it } from 'vitest';

import { createDatasetsPageStore, datasetsPageInitialState } from './pageState.store';

describe('createDatasetsPageStore', () => {
    it('selects dataset and toggles upload modal state', () => {
        const store = createDatasetsPageStore(datasetsPageInitialState);
        store.getState().selectDataset('dataset-1');

        let state = store.getState();
        store.getState().setShowUpload(true);

        state = store.getState();

        expect(state.selectedDatasetId).toBe('dataset-1');
        expect(state.showUpload).toBe(true);
    });
});

it('isolates editor instances', () => {
    const firstStore = createDatasetsPageStore();
    const secondStore = createDatasetsPageStore();
    const initial = secondStore.getState();
    firstStore.getState().selectDataset('one');
    expect(secondStore.getState()).toEqual(initial);
});
