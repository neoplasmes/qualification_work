import { describe, expect, it } from 'vitest';

import { createChartBuilderDraft } from '@/widgets/ChartBuilder';

import {
    chartsPageInitialState,
    chartsPageSlice,
    clearChartEditDraft,
    openChartRoute,
    openNewChartRoute,
    selectChart,
    setChartCreateDraft,
    setChartEditDraft,
    setChartsWorkspaceMode,
    setShowDatasetPicker,
} from './chartsPageSlice';

describe('chartsPageSlice', () => {
    it('selects another chart in view mode and clears editing draft', () => {
        const draft = createChartBuilderDraft({ chartName: 'Unsaved' });
        const state = chartsPageSlice.reducer(
            {
                ...chartsPageInitialState,
                selectedChartId: 'chart-1',
                createDraft: { datasetId: 'dataset-1', draft, output: null },
                workspaceMode: 'edit',
                editDraft: { chartId: 'chart-1', draft, output: null },
            },
            selectChart('chart-2')
        );

        expect(state.selectedChartId).toBe('chart-2');
        expect(state.createDraft).toBeNull();
        expect(state.workspaceMode).toBe('view');
        expect(state.editDraft).toBeNull();
    });

    it('opens chart routes and preserves same-chart draft while switching mode', () => {
        const draft = createChartBuilderDraft({ chartName: 'Unsaved' });
        let state = chartsPageSlice.reducer(
            {
                ...chartsPageInitialState,
                selectedChartId: 'chart-1',
                workspaceMode: 'edit',
                editDraft: { chartId: 'chart-1', draft, output: null },
            },
            openChartRoute({ chartId: 'chart-1', mode: 'view' })
        );

        expect(state.workspaceMode).toBe('view');
        expect(state.editDraft?.draft.chartName).toBe('Unsaved');

        state = chartsPageSlice.reducer(
            state,
            openChartRoute({ chartId: 'chart-2', mode: 'edit' })
        );

        expect(state.selectedChartId).toBe('chart-2');
        expect(state.workspaceMode).toBe('edit');
        expect(state.editDraft).toBeNull();
    });

    it('opens builder for a dataset and closes dataset picker', () => {
        const draft = createChartBuilderDraft();
        const state = chartsPageSlice.reducer(
            {
                ...chartsPageInitialState,
                selectedChartId: 'chart-1',
                showDatasetPicker: true,
                workspaceMode: 'edit',
                editDraft: {
                    chartId: 'chart-1',
                    draft,
                    output: null,
                },
            },
            setChartCreateDraft({ datasetId: 'dataset-2', draft, output: null })
        );

        expect(state.createDraft).toEqual({
            datasetId: 'dataset-2',
            draft,
            output: null,
        });
        expect(state.selectedChartId).toBeNull();
        expect(state.showDatasetPicker).toBe(false);
        expect(state.workspaceMode).toBe('view');
        expect(state.editDraft).toBeNull();
    });

    it('opens new chart route and keeps an existing create draft', () => {
        const draft = createChartBuilderDraft({ chartName: 'Unsaved new chart' });
        let state = chartsPageSlice.reducer(chartsPageInitialState, openNewChartRoute());

        expect(state.selectedChartId).toBeNull();
        expect(state.showDatasetPicker).toBe(true);

        state = chartsPageSlice.reducer(
            {
                ...state,
                createDraft: { datasetId: 'dataset-1', draft, output: null },
                showDatasetPicker: false,
            },
            openNewChartRoute()
        );

        expect(state.createDraft?.draft.chartName).toBe('Unsaved new chart');
        expect(state.showDatasetPicker).toBe(false);
    });

    it('stores and clears edit drafts', () => {
        const draft = createChartBuilderDraft({ chartName: 'Revenue v2' });
        let state = chartsPageSlice.reducer(
            chartsPageInitialState,
            setChartEditDraft({ chartId: 'chart-1', draft, output: null })
        );

        expect(state.editDraft).toEqual({ chartId: 'chart-1', draft, output: null });

        state = chartsPageSlice.reducer(state, clearChartEditDraft('chart-2'));
        expect(state.editDraft).toEqual({ chartId: 'chart-1', draft, output: null });

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
