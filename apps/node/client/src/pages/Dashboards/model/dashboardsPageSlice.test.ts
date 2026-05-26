import { describe, expect, it } from 'vitest';

import {
    clearChartFilter,
    clearDatasetFilter,
    clearWorkspaceMetricForm,
    dashboardsPageInitialState,
    dashboardsPageSlice,
    initDashboardsWorkspaceDraft,
    resetDashboardsWorkspaceDraft,
    selectDashboard,
    setDashboardsFilterActiveTab,
    setDashboardsWorkspaceDraftName,
    setWorkspaceMetricExpression,
    setWorkspaceMetricFormat,
    setWorkspaceMetricName,
    toggleChartFilter,
    toggleDatasetFilter,
} from './dashboardsPageSlice';

describe('dashboardsPageSlice', () => {
    it('selects dashboard and manages filter tabs', () => {
        let state = dashboardsPageSlice.reducer(
            dashboardsPageInitialState,
            selectDashboard('dashboard-1')
        );
        state = dashboardsPageSlice.reducer(
            state,
            setDashboardsFilterActiveTab('datasets')
        );

        expect(state.selectedDashboardId).toBe('dashboard-1');
        expect(state.dashboardsFilterActiveTab).toBe('datasets');
    });

    it('toggles and clears chart and dataset filters', () => {
        let state = dashboardsPageSlice.reducer(
            dashboardsPageInitialState,
            toggleChartFilter('chart-1')
        );
        state = dashboardsPageSlice.reducer(state, toggleDatasetFilter('dataset-1'));
        state = dashboardsPageSlice.reducer(state, toggleDatasetFilter('dataset-1'));

        expect(state.filterChartIds).toEqual(['chart-1']);
        expect(state.filterDatasetIds).toEqual([]);

        state = dashboardsPageSlice.reducer(state, clearChartFilter());
        state = dashboardsPageSlice.reducer(state, clearDatasetFilter());

        expect(state.filterChartIds).toEqual([]);
        expect(state.filterDatasetIds).toEqual([]);
    });

    it('stores dashboard draft name and resets draft identity', () => {
        let state = dashboardsPageSlice.reducer(
            dashboardsPageInitialState,
            initDashboardsWorkspaceDraft({ dashboardId: 'dashboard-1', name: 'Sales' })
        );
        state = dashboardsPageSlice.reducer(
            state,
            setDashboardsWorkspaceDraftName('Ops')
        );

        expect(state.workspaceDraftDashboardId).toBe('dashboard-1');
        expect(state.workspaceDraftName).toBe('Ops');

        state = dashboardsPageSlice.reducer(state, resetDashboardsWorkspaceDraft());

        expect(state.workspaceDraftDashboardId).toBeNull();
        expect(state.workspaceDraftName).toBe('');
    });

    it('stores and clears metric form fields', () => {
        let state = dashboardsPageSlice.reducer(
            dashboardsPageInitialState,
            setWorkspaceMetricName('Average')
        );
        state = dashboardsPageSlice.reducer(
            state,
            setWorkspaceMetricExpression('avg(score)')
        );
        state = dashboardsPageSlice.reducer(state, setWorkspaceMetricFormat('percent'));

        expect(state.workspaceMetricName).toBe('Average');
        expect(state.workspaceMetricExpression).toBe('avg(score)');
        expect(state.workspaceMetricFormat).toBe('percent');

        state = dashboardsPageSlice.reducer(state, clearWorkspaceMetricForm());

        expect(state.workspaceMetricName).toBe('');
        expect(state.workspaceMetricExpression).toBe('');
        expect(state.workspaceMetricFormat).toBe('number');
    });
});
