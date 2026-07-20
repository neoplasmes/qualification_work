import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';

import type { ChartBuilderDraft, ChartBuilderOutput } from '@/widgets/ChartBuilder';

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
    editorChartId: string | null;
    createDraft: ChartsCreateDraft | null;
    showDatasetPicker: boolean;
    editDraft: ChartsEditDraft | null;
};

export const chartsPageInitialState: ChartsPageState = {
    editorChartId: null,
    createDraft: null,
    showDatasetPicker: false,
    editDraft: null,
};

export type ChartsPageStateStore = ChartsPageState & {
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

export function createChartsPageStore(initial: Partial<ChartsPageState> = {}) {
    return createStore<ChartsPageStateStore>()(
        immer(set => ({
            ...chartsPageInitialState,
            ...initial,
            selectChart: value =>
                set(state => {
                    const chartChanged = state.editorChartId !== value;

                    state.editorChartId = value;
                    state.createDraft = null;
                    state.showDatasetPicker = false;

                    if (chartChanged) {
                        state.editDraft = null;
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
                    }
                }),
            openNewChartRoute: () =>
                set(state => {
                    state.editorChartId = null;

                    state.editDraft = null;
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
                }),
            setChartCreateDraftValue: value =>
                set(state => {
                    if (state.createDraft) {
                        state.createDraft.draft = value;
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
                }),
            setShowDatasetPicker: value =>
                set(state => {
                    state.showDatasetPicker = value;
                }),
            setChartEditDraft: value =>
                set(state => {
                    state.editDraft = value;
                }),
            setChartEditDraftValue: value =>
                set(state => {
                    if (state.editDraft?.chartId === value.chartId) {
                        state.editDraft.draft = value.draft;
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
                    }
                }),
        }))
    );
}
