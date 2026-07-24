import { createChartBuilderDraft } from '@/ui/pages/charts/ui/ChartBuilder';
import { describe, expect, it } from 'vitest';

import { chartsPageInitialState, createChartDraftStore } from '../chartDraft';

describe('createChartDraftStore', () => {
    it('selects another chart in view mode and clears editing draft', () => {
        const draft = createChartBuilderDraft({ chartName: 'Unsaved' });
        const store = createChartDraftStore({
            ...chartsPageInitialState,
            editorChartId: 'chart-1',
            createDraft: { datasetId: 'dataset-1', draft, output: null },

            editDraft: { chartId: 'chart-1', draft, output: null },
        });
        store.getState().selectChart('chart-2');

        const state = store.getState();

        expect(state.editorChartId).toBe('chart-2');
        expect(state.createDraft).toBeNull();

        expect(state.editDraft).toBeNull();
    });

    it('opens chart routes and preserves same-chart draft while switching mode', () => {
        const draft = createChartBuilderDraft({ chartName: 'Unsaved' });
        const store = createChartDraftStore({
            ...chartsPageInitialState,
            editorChartId: 'chart-1',

            editDraft: { chartId: 'chart-1', draft, output: null },
        });
        store.getState().openChartRoute({ chartId: 'chart-1', mode: 'view' });

        let state = store.getState();

        expect(state.editDraft?.draft.chartName).toBe('Unsaved');

        store.getState().openChartRoute({ chartId: 'chart-2', mode: 'edit' });

        state = store.getState();

        expect(state.editorChartId).toBe('chart-2');

        expect(state.editDraft).toBeNull();
    });

    it('opens builder for a dataset and closes dataset picker', () => {
        const draft = createChartBuilderDraft();
        const store = createChartDraftStore({
            ...chartsPageInitialState,
            editorChartId: 'chart-1',
            showDatasetPicker: true,

            editDraft: {
                chartId: 'chart-1',
                draft,
                output: null,
            },
        });
        store
            .getState()
            .setChartCreateDraft({ datasetId: 'dataset-2', draft, output: null });

        const state = store.getState();

        expect(state.createDraft).toEqual({
            datasetId: 'dataset-2',
            draft,
            output: null,
        });
        expect(state.editorChartId).toBeNull();
        expect(state.showDatasetPicker).toBe(false);

        expect(state.editDraft).toBeNull();
    });

    it('opens new chart route and keeps an existing create draft', () => {
        const draft = createChartBuilderDraft({ chartName: 'Unsaved new chart' });
        const store = createChartDraftStore(chartsPageInitialState);
        store.getState().openNewChartRoute();

        let state = store.getState();

        expect(state.editorChartId).toBeNull();
        expect(state.showDatasetPicker).toBe(true);

        store.setState({
            ...state,
            createDraft: { datasetId: 'dataset-1', draft, output: null },
            showDatasetPicker: false,
        });
        store.getState().openNewChartRoute();

        state = store.getState();

        expect(state.createDraft?.draft.chartName).toBe('Unsaved new chart');
        expect(state.showDatasetPicker).toBe(false);
    });

    it('stores and clears edit drafts', () => {
        const draft = createChartBuilderDraft({ chartName: 'Revenue v2' });
        const store = createChartDraftStore(chartsPageInitialState);
        store.getState().setChartEditDraft({ chartId: 'chart-1', draft, output: null });

        let state = store.getState();

        expect(state.editDraft).toEqual({ chartId: 'chart-1', draft, output: null });

        store.getState().clearChartEditDraft('chart-2');

        state = store.getState();
        expect(state.editDraft).toEqual({ chartId: 'chart-1', draft, output: null });

        store.getState().clearChartEditDraft('chart-1');

        state = store.getState();
        expect(state.editDraft).toBeNull();
    });

    it('switches workspace mode and dataset picker flag', () => {
        const store = createChartDraftStore(chartsPageInitialState);
        store.getState().setShowDatasetPicker(false);

        let state = store.getState();
        store.getState().setShowDatasetPicker(true);

        state = store.getState();

        expect(state.showDatasetPicker).toBe(true);
    });
});

it('isolates editor instances', () => {
    const firstStore = createChartDraftStore();
    const secondStore = createChartDraftStore();
    const initial = secondStore.getState();
    firstStore.getState().setChartEditDraft({
        chartId: 'one',
        draft: createChartBuilderDraft({ chartName: 'Dirty' }),
        output: null,
    });
    expect(secondStore.getState()).toEqual(initial);
});
