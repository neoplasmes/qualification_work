import { describe, expect, it } from 'vitest';

import {
    chartsPageInitialState,
    chartsPageSlice,
    initWorkspaceDraft,
    resetWorkspaceDraft,
    selectChart,
    setBuilderDatasetId,
    setShowDatasetPicker,
    setWorkspaceDraftChartType,
    setWorkspaceDraftConfigText,
    setWorkspaceDraftName,
    setWorkspaceFilterOverrideText,
} from './chartsPageSlice';

describe('chartsPageSlice', () => {
    it('selects charts and resets builder dataset', () => {
        const state = chartsPageSlice.reducer(
            { ...chartsPageInitialState, builderDatasetId: 'dataset-1' },
            selectChart('chart-1')
        );

        expect(state.selectedChartId).toBe('chart-1');
        expect(state.builderDatasetId).toBeNull();
    });

    it('opens builder for a dataset and closes dataset picker', () => {
        const state = chartsPageSlice.reducer(
            {
                ...chartsPageInitialState,
                selectedChartId: 'chart-1',
                showDatasetPicker: true,
            },
            setBuilderDatasetId('dataset-2')
        );

        expect(state.builderDatasetId).toBe('dataset-2');
        expect(state.selectedChartId).toBeNull();
        expect(state.showDatasetPicker).toBe(false);
    });

    it('stores workspace draft fields and resets them together', () => {
        let state = chartsPageSlice.reducer(
            chartsPageInitialState,
            initWorkspaceDraft({
                chartId: 'chart-1',
                name: 'Revenue',
                chartType: 'line',
                configText: '{"x":"month"}',
            })
        );
        state = chartsPageSlice.reducer(state, setWorkspaceDraftName('Revenue v2'));
        state = chartsPageSlice.reducer(state, setWorkspaceDraftChartType('pie'));
        state = chartsPageSlice.reducer(
            state,
            setWorkspaceDraftConfigText('{"x":"status"}')
        );
        state = chartsPageSlice.reducer(
            state,
            setWorkspaceFilterOverrideText('[{"op":"eq"}]')
        );
        state = chartsPageSlice.reducer(state, setShowDatasetPicker(true));

        expect(state).toMatchObject({
            workspaceDraftChartId: 'chart-1',
            workspaceDraftName: 'Revenue v2',
            workspaceDraftChartType: 'pie',
            workspaceDraftConfigText: '{"x":"status"}',
            workspaceFilterOverrideText: '[{"op":"eq"}]',
            showDatasetPicker: true,
        });

        state = chartsPageSlice.reducer(state, resetWorkspaceDraft());

        expect(state.workspaceDraftChartId).toBeNull();
        expect(state.workspaceDraftName).toBe('');
        expect(state.workspaceDraftChartType).toBe('bar');
        expect(state.workspaceDraftConfigText).toBe('');
        expect(state.workspaceFilterOverrideText).toBe('');
    });
});
