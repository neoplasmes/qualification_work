import { describe, expect, it } from 'vitest';

import {
    clearWorkspaceMetricForm,
    dashboardsPageInitialState,
    dashboardsPageSlice,
    initDashboardsWorkspaceDraft,
    resetDashboardsWorkspaceDraft,
    selectDashboard,
    setDashboardsWorkspaceDraftName,
    setWorkspaceMetricExpression,
    setWorkspaceMetricFormat,
    setWorkspaceMetricName,
    setWorkspaceMetricValueMultiplier,
} from './dashboardsPageSlice';

describe('dashboardsPageSlice', () => {
    it('selects dashboard', () => {
        const state = dashboardsPageSlice.reducer(
            dashboardsPageInitialState,
            selectDashboard('dashboard-1')
        );

        expect(state.selectedDashboardId).toBe('dashboard-1');
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
        state = dashboardsPageSlice.reducer(state, setWorkspaceMetricFormat('%'));
        state = dashboardsPageSlice.reducer(
            state,
            setWorkspaceMetricValueMultiplier('100')
        );

        expect(state.workspaceMetricName).toBe('Average');
        expect(state.workspaceMetricExpression).toBe('avg(score)');
        expect(state.workspaceMetricFormat).toBe('%');
        expect(state.workspaceMetricValueMultiplier).toBe('100');

        state = dashboardsPageSlice.reducer(state, clearWorkspaceMetricForm());

        expect(state.workspaceMetricName).toBe('');
        expect(state.workspaceMetricExpression).toBe('');
        expect(state.workspaceMetricFormat).toBe('');
        expect(state.workspaceMetricValueMultiplier).toBe('1');
    });
});
