import { describe, expect, it } from 'vitest';

import {
    actionsPageInitialState,
    actionsPageSlice,
    clearAllActionsFilters,
    selectAction,
    setActionsWorkspaceTab,
    startCreateAction,
    toggleActionsDatasetFilter,
    toggleActionsEffectFilter,
    toggleActionsRunStatusFilter,
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

    it('toggles filters and clears them', () => {
        let state = actionsPageSlice.reducer(
            actionsPageInitialState,
            toggleActionsDatasetFilter('dataset-1')
        );
        state = actionsPageSlice.reducer(state, toggleActionsEffectFilter('insertRow'));
        state = actionsPageSlice.reducer(state, toggleActionsRunStatusFilter('failed'));

        expect(state.filterDatasetIds).toEqual(['dataset-1']);
        expect(state.filterEffectKinds).toEqual(['insertRow']);
        expect(state.filterRunStatuses).toEqual(['failed']);

        state = actionsPageSlice.reducer(state, clearAllActionsFilters());

        expect(state.filterDatasetIds).toEqual([]);
        expect(state.filterEffectKinds).toEqual([]);
        expect(state.filterRunStatuses).toEqual([]);
    });

    it('switches center tabs', () => {
        const state = actionsPageSlice.reducer(
            actionsPageInitialState,
            setActionsWorkspaceTab('run')
        );

        expect(state.workspaceTab).toBe('run');
    });
});
