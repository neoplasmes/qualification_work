import { createChartDraftStore } from '.';
import type { Chart } from '@/core/entities/chart';
import { describe, expect, it } from 'vitest';

import { createChartBuilderDraft } from '../../ui/ChartBuilder/model';

const chart: Chart = {
    ref: 'chart:org/chart',
    id: 'chart',
    orgId: 'org',
    datasetId: 'dataset',
    name: 'original',
    chartType: 'bar',
    config: {
        kind: 'bar',
        dimension: { columnId: 'category' },
        measures: [{ aggregate: 'sum', columnId: 'value' }],
    },
    createdAt: '',
    updatedAt: '',
};

describe('chart draft ownership', () => {
    it('isolates hosts and retains dirty text across background acceptance', () => {
        const first = createChartDraftStore({ chart });
        const second = createChartDraftStore({ chart });
        first.getState().setChartEditDraftValue({
            chartId: chart.id,
            draft: { ...first.getState().editDraft!.draft, chartName: 'unsaved' },
        });
        first.getState().acceptServer({ ...chart, name: 'server' });
        expect(first.getState().editDraft!.draft.chartName).toBe('unsaved');
        expect(first.getState().dirty).toBe(true);
        expect(second.getState().editDraft!.draft.chartName).toBe('original');
        first.getState().reset();
        expect(first.getState().editDraft!.draft.chartName).toBe('server');
        expect(first.getState().dirty).toBe(false);
    });

    it('resets only dataset-dependent bindings', () => {
        const store = createChartDraftStore();
        const draft = createChartBuilderDraft({
            chartName: 'retained',
            chartColor: '#123456',
            chartType: 'line',
        });
        if (!('dimensionColumnId' in draft.chartDraft)) {
            throw new Error('Expected dimension');
        }
        draft.chartDraft.dimensionColumnId = 'old';
        draft.chartDraft.measures = [
            { columnId: 'old-number', aggregate: 'avg', valueFormat: 'rub' },
        ];
        draft.chartDraft.filterEnabled = true;
        draft.chartDraft.filterValue = 'old value';
        store
            .getState()
            .setChartCreateDraft({ datasetId: 'previous', draft, output: null });
        store.getState().changeDataset('next');
        expect(store.getState().createDraft).toMatchObject({
            datasetId: 'next',
            draft: {
                chartName: 'retained',
                chartColor: '#123456',
                chartType: 'line',
                chartDraft: {
                    dimensionColumnId: '',
                    measures: [{ columnId: '', aggregate: 'avg', valueFormat: 'rub' }],
                    filterEnabled: false,
                    filterValue: '',
                },
            },
        });
        expect(store.getState().dirty).toBe(true);
    });
});

it('retains the acknowledged baseline for a later edit cancellation', () => {
    const store = createChartDraftStore({ chart });
    store.getState().acceptServer({ ...chart, name: 'saved revision' });
    store.getState().clearChartEditDraft(chart.id);
    store.getState().setChartEditDraft({
        chartId: chart.id,
        draft: createChartBuilderDraft({ chartName: 'second unsaved edit' }),
        output: null,
    });
    store.getState().reset();
    expect(store.getState().editDraft?.draft.chartName).toBe('saved revision');
});
