import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ActionRunStatus } from '@/entities/action';

export type ActionsWorkspaceTab = 'configure' | 'run';
export type ActionsRightPanelTab = 'history' | 'properties' | 'filters';
export type ActionsFilterTab = 'datasets' | 'effects' | 'runs';
export type ActionsEffectFilter = 'insertRow' | 'updateRowsByMatch';

export type ActionsPageState = {
    selectedActionId: string | null;
    isCreatingAction: boolean;
    workspaceTab: ActionsWorkspaceTab;
    rightPanelTab: ActionsRightPanelTab;
    filtersTab: ActionsFilterTab;
    searchText: string;
    filterDatasetIds: string[];
    filterEffectKinds: ActionsEffectFilter[];
    filterRunStatuses: ActionRunStatus[];
};

type StateWithActionsPage = { actionsPage: ActionsPageState };

export const actionsPageInitialState: ActionsPageState = {
    selectedActionId: null,
    isCreatingAction: false,
    workspaceTab: 'configure',
    rightPanelTab: 'history',
    filtersTab: 'datasets',
    searchText: '',
    filterDatasetIds: [],
    filterEffectKinds: [],
    filterRunStatuses: [],
};

const toggleValue = <T>(items: T[], value: T) => {
    const index = items.indexOf(value);
    if (index >= 0) {
        items.splice(index, 1);
    } else {
        items.push(value);
    }
};

export const actionsPageSlice = createSlice({
    name: 'actionsPage',
    initialState: actionsPageInitialState,
    reducers: {
        selectAction(state, action: PayloadAction<string | null>) {
            state.selectedActionId = action.payload;
            state.isCreatingAction = false;
            state.workspaceTab = action.payload ? state.workspaceTab : 'configure';
        },
        startCreateAction(state) {
            state.selectedActionId = null;
            state.isCreatingAction = true;
            state.workspaceTab = 'configure';
            state.rightPanelTab = 'properties';
        },
        cancelCreateAction(state) {
            state.isCreatingAction = false;
        },
        setActionsWorkspaceTab(state, action: PayloadAction<ActionsWorkspaceTab>) {
            state.workspaceTab = action.payload;
        },
        setActionsRightPanelTab(state, action: PayloadAction<ActionsRightPanelTab>) {
            state.rightPanelTab = action.payload;
        },
        setActionsFiltersTab(state, action: PayloadAction<ActionsFilterTab>) {
            state.filtersTab = action.payload;
        },
        setActionsSearchText(state, action: PayloadAction<string>) {
            state.searchText = action.payload;
        },
        toggleActionsDatasetFilter(state, action: PayloadAction<string>) {
            toggleValue(state.filterDatasetIds, action.payload);
        },
        toggleActionsEffectFilter(state, action: PayloadAction<ActionsEffectFilter>) {
            toggleValue(state.filterEffectKinds, action.payload);
        },
        toggleActionsRunStatusFilter(state, action: PayloadAction<ActionRunStatus>) {
            toggleValue(state.filterRunStatuses, action.payload);
        },
        clearActionsDatasetFilters(state) {
            state.filterDatasetIds = [];
        },
        clearActionsEffectFilters(state) {
            state.filterEffectKinds = [];
        },
        clearActionsRunStatusFilters(state) {
            state.filterRunStatuses = [];
        },
        clearAllActionsFilters(state) {
            state.searchText = '';
            state.filterDatasetIds = [];
            state.filterEffectKinds = [];
            state.filterRunStatuses = [];
        },
    },
});

export const {
    cancelCreateAction,
    clearActionsDatasetFilters,
    clearActionsEffectFilters,
    clearActionsRunStatusFilters,
    clearAllActionsFilters,
    selectAction,
    setActionsFiltersTab,
    setActionsRightPanelTab,
    setActionsSearchText,
    setActionsWorkspaceTab,
    startCreateAction,
    toggleActionsDatasetFilter,
    toggleActionsEffectFilter,
    toggleActionsRunStatusFilter,
} = actionsPageSlice.actions;

export const selectSelectedActionId = (state: StateWithActionsPage) =>
    state.actionsPage.selectedActionId;
export const selectIsCreatingAction = (state: StateWithActionsPage) =>
    state.actionsPage.isCreatingAction;
export const selectActionsWorkspaceTab = (state: StateWithActionsPage) =>
    state.actionsPage.workspaceTab;
export const selectActionsRightPanelTab = (state: StateWithActionsPage) =>
    state.actionsPage.rightPanelTab;
export const selectActionsFiltersTab = (state: StateWithActionsPage) =>
    state.actionsPage.filtersTab;
export const selectActionsSearchText = (state: StateWithActionsPage) =>
    state.actionsPage.searchText;
export const selectActionsFilterDatasetIds = (state: StateWithActionsPage) =>
    state.actionsPage.filterDatasetIds;
export const selectActionsFilterEffectKinds = (state: StateWithActionsPage) =>
    state.actionsPage.filterEffectKinds;
export const selectActionsFilterRunStatuses = (state: StateWithActionsPage) =>
    state.actionsPage.filterRunStatuses;
