import { describe, expect, it } from 'vitest';

import {
    clearChartFilter,
    clearDashboardFilter,
    datasetsPageInitialState,
    datasetsPageSlice,
    selectDataset,
    setDatasetsFilterActiveTab,
    setShowUpload,
    toggleChartFilter,
    toggleDashboardFilter,
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

    it('toggles and clears relationship filters', () => {
        let state = datasetsPageSlice.reducer(
            datasetsPageInitialState,
            toggleChartFilter('chart-1')
        );
        state = datasetsPageSlice.reducer(state, toggleChartFilter('chart-2'));
        state = datasetsPageSlice.reducer(state, toggleChartFilter('chart-1'));
        state = datasetsPageSlice.reducer(state, toggleDashboardFilter('dashboard-1'));

        expect(state.filterChartIds).toEqual(['chart-2']);
        expect(state.filterDashboardIds).toEqual(['dashboard-1']);

        state = datasetsPageSlice.reducer(state, clearChartFilter());
        state = datasetsPageSlice.reducer(state, clearDashboardFilter());

        expect(state.filterChartIds).toEqual([]);
        expect(state.filterDashboardIds).toEqual([]);
    });

    it('switches filter tabs', () => {
        const state = datasetsPageSlice.reducer(
            datasetsPageInitialState,
            setDatasetsFilterActiveTab('dashboards')
        );

        expect(state.datasetsFilterActiveTab).toBe('dashboards');
    });
});
