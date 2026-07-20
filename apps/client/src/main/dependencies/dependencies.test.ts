import { beforeEach, expect, it } from 'vitest';

import { createUiState } from '../uiState';

beforeEach(() => localStorage.clear());
it('restores preferences after mount', () => {
    localStorage.setItem(
        'panelLayout_v2',
        JSON.stringify({
            sizes: { workspace: [360, 900, 420] },
            isLeftCollapsed: true,
            isRightCollapsed: false,
        })
    );
    localStorage.setItem(
        'datasetsPage_v1',
        JSON.stringify({ selectedDatasetId: 'dataset-1' })
    );
    localStorage.setItem(
        'actionsPage_v1',
        JSON.stringify({
            selectedActionId: 'action-1',
            workspaceMode: 'edit',
            rightPanelTab: 'properties',
        })
    );
    localStorage.setItem(
        'chartsPage_v1',
        JSON.stringify({ selectedChartId: 'chart-1', createDraft: {} })
    );
    const ui = createUiState(true);
    expect(ui.panelLayout.getState().isLeftCollapsed).toBe(false);
    ui.hydrate();
    expect(ui.panelLayout.getState().sizes.workspace).toEqual([360, 900, 420]);
    expect(ui.datasets.getState().selectedDatasetId).toBe('dataset-1');
    expect(ui.actions.getState().rememberedActionId).toBeNull();
    expect(ui.actions.getState().rightPanelTab).toBe('properties');
    expect(ui.charts.getState().rememberedChartId).toBeNull();
    expect('createDraft' in ui.charts.getState()).toBe(false);
    ui.dispose();
});
it('preserves layout on logout', () => {
    const ui = createUiState(true);
    ui.hydrate();
    ui.panelLayout.getState().toggleLeftPanel();
    ui.datasets.getState().selectDataset('dataset-1');
    ui.reset();
    expect(ui.panelLayout.getState().isLeftCollapsed).toBe(true);
    expect(ui.datasets.getState().selectedDatasetId).toBeNull();
    expect(localStorage.getItem('datasetsPage_v1')).toBeNull();
    expect(JSON.parse(localStorage.getItem('panelLayout_v2')!).isLeftCollapsed).toBe(
        true
    );
    ui.dispose();
});
it('hydrates preferences without replacing a newer route selection', () => {
    localStorage.setItem(
        'actionsPage_v1',
        JSON.stringify({ rightPanelTab: 'properties' })
    );
    localStorage.setItem(
        'dashboardsPage_v1',
        JSON.stringify({
            selectedDashboardId: 'stored',
            workspaceDraftDashboardId: 'draft',
            workspaceDraftName: 'Unsaved',
        })
    );
    const ui = createUiState(true);
    ui.actions.getState().openActionRoute({ actionId: 'explicit', mode: 'edit' });
    ui.dashboards.getState().selectDashboard('explicit');
    ui.hydrate();
    expect(ui.actions.getState().rememberedActionId).toBe('explicit');
    expect(ui.actions.getState().rightPanelTab).toBe('properties');
    expect(ui.dashboards.getState().rememberedDashboardId).toBe('explicit');
    expect(ui.dashboards.getState().workspaceDraftName).toBe('Unsaved');
    ui.dispose();
});

it('writes only raw whitelisted preferences and clears session keys', () => {
    const ui = createUiState(true);
    ui.hydrate();
    ui.actions.getState().openActionRoute({ actionId: 'action', mode: 'edit' });
    ui.actions.getState().setActionsRightPanelTab('properties');
    ui.datasets.getState().selectDataset('dataset');
    ui.dashboards.getState().selectDashboard('dashboard');
    ui.dashboards
        .getState()
        .initDashboardsWorkspaceDraft({ dashboardId: 'dashboard', name: 'Draft' });
    ui.filters.getState().toggleFilterApplicationValue({
        scope: 'dashboards',
        entity: 'charts',
        value: 'chart',
    });
    ui.activeOrganization.getState().setActiveOrgId('organization');
    expect(localStorage.getItem('actionsPage_v1')).toBe(
        JSON.stringify({ rightPanelTab: 'properties' })
    );
    expect(localStorage.getItem('datasetsPage_v1')).toBe(
        JSON.stringify({ selectedDatasetId: 'dataset' })
    );
    expect(JSON.parse(localStorage.getItem('dashboardsPage_v1')!)).toEqual({
        selectedDashboardId: 'dashboard',
        workspaceDraftDashboardId: 'dashboard',
        workspaceDraftName: 'Draft',
    });
    expect(
        Object.keys(JSON.parse(localStorage.getItem('filterApplicationEntities_v3')!))
    ).toEqual(['activeTabs', 'values']);
    expect(localStorage.getItem('qualification-work.active-org-id')).toBe('organization');
    expect(localStorage.getItem('chartsPage_v1')).toBeNull();
    ui.reset();
    expect(ui.actions.getState().rememberedActionId).toBeNull();
    expect(ui.dashboards.getState().rememberedDashboardId).toBeNull();
    expect(ui.filters.getState().values.dashboards.charts).toEqual([]);
    expect(ui.activeOrganization.getState().activeOrgId).toBeNull();
    for (const key of [
        'actionsPage_v1',
        'datasetsPage_v1',
        'dashboardsPage_v1',
        'filterApplicationEntities_v3',
        'qualification-work.active-org-id',
    ]) {
        expect(localStorage.getItem(key)).toBeNull();
    }
    ui.dispose();
});
