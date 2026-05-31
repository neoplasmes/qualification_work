import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type {
    FilterApplicationEntitiesState,
    FilterApplicationEntity,
    FilterApplicationEntityValues,
    FilterApplicationScope,
} from '../types';

type StateWithFilterApplicationEntities = {
    filterApplicationEntities: FilterApplicationEntitiesState;
};

type FilterApplicationEntityPayload = {
    scope: FilterApplicationScope;
    entity: FilterApplicationEntity;
};

type FilterApplicationValuePayload = FilterApplicationEntityPayload & {
    value: string;
};

const createEmptyValues = (): FilterApplicationEntityValues => ({
    charts: [],
    dashboards: [],
    datasets: [],
    effects: [],
});

export const filterApplicationEntitiesInitialState: FilterApplicationEntitiesState = {
    activeTabs: {
        actions: 'datasets',
        charts: 'datasets',
        dashboards: 'charts',
        datasets: 'charts',
    },
    values: {
        actions: createEmptyValues(),
        charts: createEmptyValues(),
        dashboards: createEmptyValues(),
        datasets: createEmptyValues(),
    },
};

const toggleValue = (items: string[], value: string) => {
    const index = items.indexOf(value);

    if (index >= 0) {
        items.splice(index, 1);
    } else {
        items.push(value);
    }
};

export const filterApplicationEntitiesSlice = createSlice({
    name: 'filterApplicationEntities',
    initialState: filterApplicationEntitiesInitialState,
    reducers: {
        setFilterApplicationActiveTab(
            state,
            action: PayloadAction<FilterApplicationEntityPayload>
        ) {
            state.activeTabs[action.payload.scope] = action.payload.entity;
        },
        toggleFilterApplicationValue(
            state,
            action: PayloadAction<FilterApplicationValuePayload>
        ) {
            toggleValue(
                state.values[action.payload.scope][action.payload.entity],
                action.payload.value
            );
        },
        clearFilterApplicationScopeValues(
            state,
            action: PayloadAction<FilterApplicationScope>
        ) {
            state.values[action.payload] = createEmptyValues();
        },
    },
});

export const {
    clearFilterApplicationScopeValues,
    setFilterApplicationActiveTab,
    toggleFilterApplicationValue,
} = filterApplicationEntitiesSlice.actions;

export const selectFilterApplicationActiveTab =
    (scope: FilterApplicationScope) => (state: StateWithFilterApplicationEntities) =>
        state.filterApplicationEntities.activeTabs[scope];

export const selectFilterApplicationValues =
    (scope: FilterApplicationScope) => (state: StateWithFilterApplicationEntities) =>
        state.filterApplicationEntities.values[scope];
