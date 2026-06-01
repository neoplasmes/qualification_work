import { beforeEach, describe, expect, it } from 'vitest';

import { actionsPageInitialState } from '@/pages/Actions';
import { chartsPageInitialState } from '@/pages/Charts';

import { panelLayoutPersistence } from '@/widgets/WorkspaceGrid';

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
});
