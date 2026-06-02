import { beforeEach, describe, expect, it } from 'vitest';

import {
    actionsPageInitialState,
    openActionRoute,
    setActionsRightPanelTab,
} from '@/pages/Actions';
import { chartsPageInitialState } from '@/pages/Charts';
import { selectDashboard } from '@/pages/Dashboards';
import { selectDataset } from '@/pages/Datasets';

import {
    panelLayoutPersistence,
    toggleLeftPanel,
    toggleRightPanel,
} from '@/widgets/WorkspaceGrid';

import {
    filterApplicationEntitiesInitialState,
    toggleFilterApplicationValue,
} from '@/features/filterApplicationEntities';

import { resetAuthenticatedSessionState } from './sessionState';
import { createStore } from './store';

describe('createStore', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('keeps persisted panel layout over server preloaded fallback', () => {
        localStorage.setItem(
            panelLayoutPersistence.key,
            JSON.stringify({
                sizes: { workspace: [360, 900, 420] },
                isLeftCollapsed: true,
                isRightCollapsed: false,
            })
        );

        const store = createStore({
            panelLayout: {
                sizes: {},
                isLeftCollapsed: false,
                isRightCollapsed: false,
            },
        });

        expect(store.getState().panelLayout).toEqual({
            sizes: { workspace: [360, 900, 420] },
            isLeftCollapsed: true,
            isRightCollapsed: false,
        });
    });

    it('does not hydrate charts page from localStorage', () => {
        localStorage.setItem(
            'chartsPage_v1',
            JSON.stringify({ selectedChartId: 'chart-1' })
        );

        const store = createStore();

        expect(store.getState().chartsPage).toEqual(chartsPageInitialState);
    });

    it('does not hydrate actions selection or mode from localStorage', () => {
        localStorage.setItem(
            'actionsPage_v1',
            JSON.stringify({
                selectedActionId: 'action-1',
                workspaceMode: 'edit',
                rightPanelTab: 'properties',
            })
        );

        const store = createStore();

        expect(store.getState().actionsPage).toEqual({
            ...actionsPageInitialState,
            rightPanelTab: 'properties',
        });
    });

    it('resets authenticated session state while keeping global panel layout', () => {
        const store = createStore();

        store.dispatch(toggleLeftPanel());
        store.dispatch(toggleRightPanel());
        store.dispatch(selectDataset('dataset-1'));
        store.dispatch(selectDashboard('dashboard-1'));
        store.dispatch(openActionRoute({ actionId: 'action-1', mode: 'edit' }));
        store.dispatch(setActionsRightPanelTab('properties'));
        store.dispatch(
            toggleFilterApplicationValue({
                scope: 'dashboards',
                entity: 'charts',
                value: 'chart-1',
            })
        );

        store.dispatch(resetAuthenticatedSessionState());

        expect(store.getState().panelLayout).toEqual({
            sizes: {},
            isLeftCollapsed: true,
            isRightCollapsed: true,
        });
        expect(store.getState().datasetsPage.selectedDatasetId).toBeNull();
        expect(store.getState().dashboardsPage.selectedDashboardId).toBeNull();
        expect(store.getState().actionsPage).toEqual(actionsPageInitialState);
        expect(store.getState().filterApplicationEntities).toEqual(
            filterApplicationEntitiesInitialState
        );
    });
});
