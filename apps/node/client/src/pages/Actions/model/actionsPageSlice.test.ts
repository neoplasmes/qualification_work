import { describe, expect, it } from 'vitest';

import {
    actionsPageInitialState,
    actionsPageSlice,
    selectAction,
    setActionsWorkspaceTab,
    startCreateAction,
} from './actionsPageSlice';

describe('actionsPageSlice', () => {
    it('starts a new action draft in configure mode', () => {
        const state = actionsPageSlice.reducer(
            {
                ...actionsPageInitialState,
                selectedActionId: 'action-1',
                workspaceTab: 'run',
            },
            startCreateAction()
        );

        expect(state.selectedActionId).toBeNull();
        expect(state.isCreatingAction).toBe(true);
        expect(state.workspaceTab).toBe('configure');
        expect(state.rightPanelTab).toBe('properties');
    });

    it('selects an existing action and leaves create mode', () => {
        const state = actionsPageSlice.reducer(
            { ...actionsPageInitialState, isCreatingAction: true },
            selectAction('action-1')
        );

        expect(state.selectedActionId).toBe('action-1');
        expect(state.isCreatingAction).toBe(false);
    });

    it('switches center tabs', () => {
        const state = actionsPageSlice.reducer(
            actionsPageInitialState,
            setActionsWorkspaceTab('run')
        );

        expect(state.workspaceTab).toBe('run');
    });
});
