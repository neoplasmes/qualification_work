import { describe, expect, it } from 'vitest';

import {
    chartsPageInitialState,
    chartsPageSlice,
    clearDashboardFilter,
    clearDatasetFilter,
    initWorkspaceDraft,
    resetWorkspaceDraft,
    selectChart,
    setBuilderDatasetId,
    setChartsFilterActiveTab,
    setShowDatasetPicker,
    setWorkspaceDraftChartType,
    setWorkspaceDraftConfigText,
    setWorkspaceDraftName,
    setWorkspaceFilterOverrideText,
    toggleDashboardFilter,
    toggleDatasetFilter,
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

    it('toggles and clears dataset and dashboard filters', () => {
        let state = chartsPageSlice.reducer(
            chartsPageInitialState,
            toggleDatasetFilter('ds-1')
        );
        state = chartsPageSlice.reducer(state, toggleDatasetFilter('ds-2'));
        state = chartsPageSlice.reducer(state, toggleDatasetFilter('ds-1'));
        state = chartsPageSlice.reducer(state, toggleDashboardFilter('db-1'));

        expect(state.filterDatasetIds).toEqual(['ds-2']);
        expect(state.filterDashboardIds).toEqual(['db-1']);

        state = chartsPageSlice.reducer(state, clearDatasetFilter());
        state = chartsPageSlice.reducer(state, clearDashboardFilter());

        expect(state.filterDatasetIds).toEqual([]);
        expect(state.filterDashboardIds).toEqual([]);
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
        state = chartsPageSlice.reducer(state, setChartsFilterActiveTab('dashboards'));
        state = chartsPageSlice.reducer(state, setShowDatasetPicker(true));

        expect(state).toMatchObject({
            workspaceDraftChartId: 'chart-1',
            workspaceDraftName: 'Revenue v2',
            workspaceDraftChartType: 'pie',
            workspaceDraftConfigText: '{"x":"status"}',
            workspaceFilterOverrideText: '[{"op":"eq"}]',
            chartsFilterActiveTab: 'dashboards',
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
