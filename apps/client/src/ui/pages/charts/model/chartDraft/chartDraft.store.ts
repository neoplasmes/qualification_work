import type { Chart } from '@/core/entities/chart';
import type {
    ChartBuilderDraft,
    ChartBuilderOutput,
} from '@/ui/pages/charts/ui/ChartBuilder';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import {
    configToBuilderDraft,
    createChartBuilderDraft,
    resetChartDatasetBindings,
} from '../../ui/ChartBuilder/model';

export type ChartsRightPanelTab = 'properties' | 'filters';
export type ChartsWorkspaceMode = 'view' | 'edit';

export type ChartsEditDraft = {
    chartId: string;
    draft: ChartBuilderDraft;
    output: ChartBuilderOutput | null;
};

export type ChartsCreateDraft = {
    datasetId: string;
    draft: ChartBuilderDraft;
    output: ChartBuilderOutput | null;
};

export type ChartsPageState = {
    dirty: boolean;
    baseline: ChartBuilderDraft | null;
    editorChartId: string | null;
    createDraft: ChartsCreateDraft | null;
    showDatasetPicker: boolean;
    editDraft: ChartsEditDraft | null;
};

export const chartsPageInitialState: ChartsPageState = {
    dirty: false,
    baseline: null,
    editorChartId: null,
    createDraft: null,
    showDatasetPicker: false,
    editDraft: null,
};

export type ChartsPageStateStore = ChartsPageState & {
    reset(): void;
    acceptServer(chart: Chart): void;
    changeDataset(datasetId: string): void;
    selectChart(value: string | null): void;
    openChartRoute(value: { chartId: string; mode: ChartsWorkspaceMode }): void;
    openNewChartRoute(): void;
    setChartCreateDraft(value: ChartsCreateDraft): void;
    setChartCreateDraftValue(value: ChartBuilderDraft): void;
    setChartCreateOutput(value: ChartBuilderOutput): void;
    clearChartCreateDraft(): void;
    setShowDatasetPicker(value: boolean): void;
    setChartEditDraft(value: ChartsEditDraft): void;
    setChartEditDraftValue(value: { chartId: string; draft: ChartBuilderDraft }): void;
    setChartEditOutput(value: { chartId: string; output: ChartBuilderOutput }): void;
    clearChartEditDraft(value: string | undefined): void;
};

export function createChartDraftStore(
    initial: Partial<ChartsPageState> & { chart?: Chart; dataset?: DatasetMetadata } = {}
) {
    const initialDraft = initial.chart
        ? createChartBuilderDraft({
              ...configToBuilderDraft(initial.chart.config, initial.chart.chartType),
              chartName: initial.chart.name,
          })
        : createChartBuilderDraft();

    return createStore<ChartsPageStateStore>()(
        immer(set => ({
            ...chartsPageInitialState,
            ...initial,
            ...(initial.chart
                ? {
                      editorChartId: initial.chart.id,
                      baseline: initialDraft,
                      editDraft: {
                          chartId: initial.chart.id,
                          draft: initialDraft,
                          output: null,
                      },
                  }
                : {}),
            ...(initial.dataset
                ? {
                      createDraft: {
                          datasetId: initial.dataset.dataset.id,
                          draft: initialDraft,
                          output: null,
                      },
                  }
                : {}),
            reset: () =>
                set(state => {
                    if (state.editDraft && state.baseline) {
                        state.editDraft = {
                            ...state.editDraft,
                            draft: state.baseline,
                            output: null,
                        };
                    } else if (state.createDraft) {
                        state.createDraft = {
                            ...state.createDraft,
                            draft: createChartBuilderDraft(),
                            output: null,
                        };
                    }
                    state.dirty = false;
                }),
            acceptServer: chart =>
                set(state => {
                    if (state.editorChartId !== chart.id) {
                        return;
                    }
                    const draft = createChartBuilderDraft({
                        ...configToBuilderDraft(chart.config, chart.chartType),
                        chartName: chart.name,
                    });
                    state.baseline = draft;
                    if (!state.dirty) {
                        state.editDraft = { chartId: chart.id, draft, output: null };
                    }
                }),
            changeDataset: datasetId =>
                set(state => {
                    if (!state.createDraft || state.createDraft.datasetId === datasetId) {
                        return;
                    }
                    state.createDraft = {
                        datasetId,
                        draft: resetChartDatasetBindings(state.createDraft.draft),
                        output: null,
                    };
                    state.showDatasetPicker = false;
                    state.dirty = true;
                }),
            selectChart: value =>
                set(state => {
                    const chartChanged = state.editorChartId !== value;

                    state.editorChartId = value;
                    state.createDraft = null;
                    state.showDatasetPicker = false;

                    if (chartChanged) {
                        state.editDraft = null;
                        state.dirty = false;
                        state.baseline = null;
                    }
                }),
            openChartRoute: value =>
                set(state => {
                    const chartChanged = state.editorChartId !== value.chartId;

                    state.editorChartId = value.chartId;
                    state.createDraft = null;
                    state.showDatasetPicker = false;

                    if (chartChanged) {
                        state.editDraft = null;
                        state.dirty = false;
                        state.baseline = null;
                    }
                }),
            openNewChartRoute: () =>
                set(state => {
                    state.editorChartId = null;

                    state.editDraft = null;
                    state.dirty = false;
                    state.baseline = null;
                    if (!state.createDraft) {
                        state.showDatasetPicker = true;
                    }
                }),
            setChartCreateDraft: value =>
                set(state => {
                    state.createDraft = value;
                    state.editorChartId = null;
                    state.showDatasetPicker = false;

                    state.editDraft = null;
                    state.dirty = false;
                    state.baseline = null;
                }),
            setChartCreateDraftValue: value =>
                set(state => {
                    if (state.createDraft) {
                        state.createDraft.draft = value;
                        state.dirty = true;
                    }
                }),
            setChartCreateOutput: value =>
                set(state => {
                    if (state.createDraft) {
                        state.createDraft.output = value;
                    }
                }),
            clearChartCreateDraft: () =>
                set(state => {
                    state.createDraft = null;
                    state.showDatasetPicker = false;
                    state.dirty = false;
                }),
            setShowDatasetPicker: value =>
                set(state => {
                    state.showDatasetPicker = value;
                }),
            setChartEditDraft: value =>
                set(state => {
                    state.editDraft = value;
                    state.dirty = true;
                }),
            setChartEditDraftValue: value =>
                set(state => {
                    if (state.editDraft?.chartId === value.chartId) {
                        state.editDraft.draft = value.draft;
                        state.dirty = true;
                    }
                }),
            setChartEditOutput: value =>
                set(state => {
                    if (state.editDraft?.chartId === value.chartId) {
                        state.editDraft.output = value.output;
                    }
                }),
            clearChartEditDraft: value =>
                set(state => {
                    if (!value || state.editDraft?.chartId === value) {
                        state.editDraft = null;
                        state.dirty = false;
                    }
                }),
        }))
    );
}
