import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ActionsWorkspaceMode = 'view' | 'edit';
export type ActionsRightPanelTab = 'history' | 'properties' | 'filters';

export type ActionsPageState = {
    selectedActionId: string | null;
    isCreatingAction: boolean;
    workspaceMode: ActionsWorkspaceMode;
    rightPanelTab: ActionsRightPanelTab;
};

type StateWithActionsPage = { actionsPage: ActionsPageState };

export const actionsPageInitialState: ActionsPageState = {
    selectedActionId: null,
    isCreatingAction: false,
    workspaceMode: 'view',
    rightPanelTab: 'history',
};

export const actionsPageSlice = createSlice({
    name: 'actionsPage',
    initialState: actionsPageInitialState,
    reducers: {
        selectAction(state, action: PayloadAction<string | null>) {
            const actionChanged = state.selectedActionId !== action.payload;

            state.selectedActionId = action.payload;
            state.isCreatingAction = false;

            if (!action.payload || actionChanged) {
                state.workspaceMode = 'view';
            }
        },
        openActionRoute(
            state,
            action: PayloadAction<{
                actionId: string;
                mode: ActionsWorkspaceMode;
            }>
        ) {
            state.selectedActionId = action.payload.actionId;
            state.isCreatingAction = false;
            state.workspaceMode = action.payload.mode;
        },
        startCreateAction(state) {
            state.selectedActionId = null;
            state.isCreatingAction = true;
            state.workspaceMode = 'edit';
            state.rightPanelTab = 'properties';
        },
        cancelCreateAction(state) {
            state.isCreatingAction = false;
        },
        setActionsWorkspaceMode(state, action: PayloadAction<ActionsWorkspaceMode>) {
            state.workspaceMode = action.payload;
        },
        setActionsRightPanelTab(state, action: PayloadAction<ActionsRightPanelTab>) {
            state.rightPanelTab = action.payload;
        },
    },
});

export const {
    cancelCreateAction,
    openActionRoute,
    selectAction,
    setActionsRightPanelTab,
    setActionsWorkspaceMode,
    startCreateAction,
} = actionsPageSlice.actions;

export const selectSelectedActionId = (state: StateWithActionsPage) =>
    state.actionsPage.selectedActionId;
export const selectIsCreatingAction = (state: StateWithActionsPage) =>
    state.actionsPage.isCreatingAction;
export const selectActionsWorkspaceMode = (state: StateWithActionsPage) =>
    state.actionsPage.workspaceMode;
export const selectActionsRightPanelTab = (state: StateWithActionsPage) =>
    state.actionsPage.rightPanelTab;
