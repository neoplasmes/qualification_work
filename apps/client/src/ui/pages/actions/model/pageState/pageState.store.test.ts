import { describe, expect, it } from 'vitest';

import { actionsPageInitialState, createActionsPageStore } from './pageState.store';

describe('createActionsPageStore', () => {
    it('starts a new action draft in configure mode', () => {
        const store = createActionsPageStore({
            ...actionsPageInitialState,
            rememberedActionId: 'action-1',
            rememberedMode: 'view',
        });
        store.getState().startCreateAction();

        const state = store.getState();

        expect(state.rememberedActionId).toBeNull();
        expect(state.isCreatingAction).toBe(true);
        expect(state.rememberedMode).toBe('edit');
        expect(state.rightPanelTab).toBe('properties');
    });

    it('selects another action in view mode', () => {
        const store = createActionsPageStore({
            ...actionsPageInitialState,
            rememberedActionId: 'action-2',
            isCreatingAction: true,
            rememberedMode: 'edit',
        });
        store.getState().selectAction('action-1');

        const state = store.getState();

        expect(state.rememberedActionId).toBe('action-1');
        expect(state.isCreatingAction).toBe(false);
        expect(state.rememberedMode).toBe('view');
    });

    it('preserves mode when reselecting the same action', () => {
        const store = createActionsPageStore({
            ...actionsPageInitialState,
            rememberedActionId: 'action-1',
            rememberedMode: 'edit',
        });
        store.getState().selectAction('action-1');

        const state = store.getState();

        expect(state.rememberedMode).toBe('edit');
    });

    it('opens action routes in the requested mode', () => {
        const store = createActionsPageStore({
            ...actionsPageInitialState,
            isCreatingAction: true,
        });
        store.getState().openActionRoute({ actionId: 'action-1', mode: 'edit' });

        const state = store.getState();

        expect(state.rememberedActionId).toBe('action-1');
        expect(state.isCreatingAction).toBe(false);
        expect(state.rememberedMode).toBe('edit');
    });

    it('switches workspace mode', () => {
        const store = createActionsPageStore(actionsPageInitialState);
        store.getState().setActionsWorkspaceMode('edit');

        const state = store.getState();

        expect(state.rememberedMode).toBe('edit');
    });
});

it('isolates editor instances', () => {
    const firstStore = createActionsPageStore();
    const secondStore = createActionsPageStore();
    const initial = secondStore.getState();
    firstStore.getState().startCreateAction();
    expect(secondStore.getState()).toEqual(initial);
});
