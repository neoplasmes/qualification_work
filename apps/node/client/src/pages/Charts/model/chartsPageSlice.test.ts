import { describe, expect, it } from 'vitest';

import { createChartBuilderFields } from '@/features/buildChart';

import {
    chartsPageInitialState,
    chartsPageSlice,
    clearChartEditDraft,
    openChartRoute,
    selectChart,
    setBuilderDatasetId,
    setChartEditDraft,
    setChartsWorkspaceMode,
    setShowDatasetPicker,
} from './chartsPageSlice';

describe('chartsPageSlice', () => {
    it('selects another chart in view mode and clears editing draft', () => {
        const draft = createChartBuilderFields({ chartName: 'Unsaved' });
        const state = chartsPageSlice.reducer(
            {
                ...chartsPageInitialState,
                selectedChartId: 'chart-1',
                builderDatasetId: 'dataset-1',
                workspaceMode: 'edit',
                editDraft: { chartId: 'chart-1', fields: draft },
            },
            selectChart('chart-2')
        );

        expect(state.selectedChartId).toBe('chart-2');
        expect(state.builderDatasetId).toBeNull();
        expect(state.workspaceMode).toBe('view');
        expect(state.editDraft).toBeNull();
    });

    it('opens chart routes and preserves same-chart draft while switching mode', () => {
        const draft = createChartBuilderFields({ chartName: 'Unsaved' });
        let state = chartsPageSlice.reducer(
            {
                ...chartsPageInitialState,
                selectedChartId: 'chart-1',
                workspaceMode: 'edit',
                editDraft: { chartId: 'chart-1', fields: draft },
            },
            openChartRoute({ chartId: 'chart-1', mode: 'view' })
        );

        expect(state.workspaceMode).toBe('view');
        expect(state.editDraft?.fields.chartName).toBe('Unsaved');

        state = chartsPageSlice.reducer(
            state,
            openChartRoute({ chartId: 'chart-2', mode: 'edit' })
        );

        expect(state.selectedChartId).toBe('chart-2');
        expect(state.workspaceMode).toBe('edit');
        expect(state.editDraft).toBeNull();
    });

    it('opens builder for a dataset and closes dataset picker', () => {
        const state = chartsPageSlice.reducer(
            {
                ...chartsPageInitialState,
                selectedChartId: 'chart-1',
                showDatasetPicker: true,
                workspaceMode: 'edit',
                editDraft: {
                    chartId: 'chart-1',
                    fields: createChartBuilderFields(),
                },
            },
            setBuilderDatasetId('dataset-2')
        );

        expect(state.builderDatasetId).toBe('dataset-2');
        expect(state.selectedChartId).toBeNull();
        expect(state.showDatasetPicker).toBe(false);
        expect(state.workspaceMode).toBe('view');
        expect(state.editDraft).toBeNull();
    });

    it('stores and clears edit drafts', () => {
        const fields = createChartBuilderFields({ chartName: 'Revenue v2' });
        let state = chartsPageSlice.reducer(
            chartsPageInitialState,
            setChartEditDraft({ chartId: 'chart-1', fields })
        );

        expect(state.editDraft).toEqual({ chartId: 'chart-1', fields });

        state = chartsPageSlice.reducer(state, clearChartEditDraft('chart-2'));
        expect(state.editDraft).toEqual({ chartId: 'chart-1', fields });

        state = chartsPageSlice.reducer(state, clearChartEditDraft('chart-1'));
        expect(state.editDraft).toBeNull();
    });

    it('switches workspace mode and dataset picker flag', () => {
        let state = chartsPageSlice.reducer(
            chartsPageInitialState,
            setChartsWorkspaceMode('edit')
        );
        state = chartsPageSlice.reducer(state, setShowDatasetPicker(true));

        expect(state.workspaceMode).toBe('edit');
        expect(state.showDatasetPicker).toBe(true);
    });
});
