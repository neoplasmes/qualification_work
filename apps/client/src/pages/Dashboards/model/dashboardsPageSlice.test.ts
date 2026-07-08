import { describe, expect, it } from 'vitest';

import {
    clearWorkspaceMetricForm,
    dashboardsPageInitialState,
    dashboardsPageSlice,
    initDashboardsWorkspaceDraft,
    resetDashboardsWorkspaceDraft,
    selectDashboard,
    setDashboardsWorkspaceDraftName,
    setWorkspaceMetricForm,
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
            setWorkspaceMetricForm({
                name: 'Average',
                expression: 'avg(score)',
                format: '%',
                valueMultiplier: '100',
                target: '42',
                targetDirection: 'higher',
                showTrend: true,
                timeColumn: 'created_at',
                timeBucket: 'month',
            })
        );

        expect(state.workspaceMetricName).toBe('Average');
        expect(state.workspaceMetricExpression).toBe('avg(score)');
        expect(state.workspaceMetricFormat).toBe('%');
        expect(state.workspaceMetricValueMultiplier).toBe('100');
        expect(state.workspaceMetricTarget).toBe('42');
        expect(state.workspaceMetricShowTrend).toBe(true);
        expect(state.workspaceMetricTimeColumn).toBe('created_at');
        expect(state.workspaceMetricTimeBucket).toBe('month');

        state = dashboardsPageSlice.reducer(state, clearWorkspaceMetricForm());

        expect(state.workspaceMetricName).toBe('');
        expect(state.workspaceMetricExpression).toBe('');
        expect(state.workspaceMetricFormat).toBe('');
        expect(state.workspaceMetricValueMultiplier).toBe('1');
        expect(state.workspaceMetricTarget).toBe('');
        expect(state.workspaceMetricShowTrend).toBe(false);
        expect(state.workspaceMetricTimeColumn).toBe('');
        expect(state.workspaceMetricTimeBucket).toBe('');
    });
});
