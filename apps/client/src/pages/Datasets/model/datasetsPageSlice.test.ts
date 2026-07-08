import { describe, expect, it } from 'vitest';

import {
    datasetsPageInitialState,
    datasetsPageSlice,
    selectDataset,
    setShowUpload,
} from './datasetsPageSlice';

describe('datasetsPageSlice', () => {
    it('selects dataset and toggles upload modal state', () => {
        let state = datasetsPageSlice.reducer(
            datasetsPageInitialState,
            selectDataset('dataset-1')
        );
        state = datasetsPageSlice.reducer(state, setShowUpload(true));

        expect(state.selectedDatasetId).toBe('dataset-1');
        expect(state.showUpload).toBe(true);
    });
});
