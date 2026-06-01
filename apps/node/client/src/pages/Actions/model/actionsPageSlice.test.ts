import { describe, expect, it } from 'vitest';

import {
    actionsPageInitialState,
    actionsPageSlice,
    openActionRoute,
    selectAction,
    setActionsWorkspaceMode,
    startCreateAction,
} from './actionsPageSlice';

describe('actionsPageSlice', () => {
    it('starts a new action draft in configure mode', () => {
        const state = actionsPageSlice.reducer(
            {
                ...actionsPageInitialState,
                selectedActionId: 'action-1',
                workspaceMode: 'view',
            },
            startCreateAction()
        );

        expect(state.selectedActionId).toBeNull();
        expect(state.isCreatingAction).toBe(true);
        expect(state.workspaceMode).toBe('edit');
        expect(state.rightPanelTab).toBe('properties');
    });

    it('selects another action in view mode', () => {
        const state = actionsPageSlice.reducer(
            {
                ...actionsPageInitialState,
                selectedActionId: 'action-2',
                isCreatingAction: true,
                workspaceMode: 'edit',
            },
            selectAction('action-1')
        );

        expect(state.selectedActionId).toBe('action-1');
        expect(state.isCreatingAction).toBe(false);
        expect(state.workspaceMode).toBe('view');
    });

    it('preserves mode when reselecting the same action', () => {
        const state = actionsPageSlice.reducer(
            {
                ...actionsPageInitialState,
                selectedActionId: 'action-1',
                workspaceMode: 'edit',
            },
            selectAction('action-1')
        );

        expect(state.workspaceMode).toBe('edit');
    });

    it('opens action routes in the requested mode', () => {
        const state = actionsPageSlice.reducer(
            {
                ...actionsPageInitialState,
                isCreatingAction: true,
            },
            openActionRoute({ actionId: 'action-1', mode: 'edit' })
        );

        expect(state.selectedActionId).toBe('action-1');
        expect(state.isCreatingAction).toBe(false);
        expect(state.workspaceMode).toBe('edit');
    });

    it('switches workspace mode', () => {
        const state = actionsPageSlice.reducer(
            actionsPageInitialState,
            setActionsWorkspaceMode('edit')
        );

        expect(state.workspaceMode).toBe('edit');
    });
});
