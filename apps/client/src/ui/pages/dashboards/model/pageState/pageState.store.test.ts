import { describe, expect, it } from 'vitest';

import { createDashboardsPageStore, dashboardsPageInitialState } from './pageState.store';

describe('createDashboardsPageStore', () => {
    it('selects dashboard', () => {
        const store = createDashboardsPageStore(dashboardsPageInitialState);
        store.getState().selectDashboard('dashboard-1');

        const state = store.getState();

        expect(state.rememberedDashboardId).toBe('dashboard-1');
    });

    it('stores dashboard draft name and resets draft identity', () => {
        const store = createDashboardsPageStore(dashboardsPageInitialState);
        store.getState().initDashboardsWorkspaceDraft({
            dashboardId: 'dashboard-1',
            name: 'Sales',
        });

        let state = store.getState();
        store.getState().setDashboardsWorkspaceDraftName('Ops');

        state = store.getState();

        expect(state.workspaceDraftDashboardId).toBe('dashboard-1');
        expect(state.workspaceDraftName).toBe('Ops');

        store.getState().resetDashboardsWorkspaceDraft();

        state = store.getState();

        expect(state.workspaceDraftDashboardId).toBeNull();
        expect(state.workspaceDraftName).toBe('');
    });
});

it('isolates editor instances', () => {
    const firstStore = createDashboardsPageStore();
    const secondStore = createDashboardsPageStore();
    const initial = secondStore.getState();
    firstStore
        .getState()
        .initDashboardsWorkspaceDraft({ dashboardId: 'one', name: 'Dirty' });
    expect(secondStore.getState()).toEqual(initial);
});
