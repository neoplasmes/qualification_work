import type {
    FilterApplicationEntitiesState,
    FilterApplicationEntity,
    FilterApplicationEntityValues,
    FilterApplicationScope,
} from '@/core/processes/entityFiltering';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';

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

export type FilterApplicationEntitiesStateStore = FilterApplicationEntitiesState & {
    setFilterApplicationActiveTab(value: FilterApplicationEntityPayload): void;
    toggleFilterApplicationValue(value: FilterApplicationValuePayload): void;
    clearFilterApplicationScopeValues(value: FilterApplicationScope): void;
};

export function createFiltersStore(
    initial: Partial<FilterApplicationEntitiesState> = {}
) {
    return createStore<FilterApplicationEntitiesStateStore>()(
        immer(set => ({
            ...filterApplicationEntitiesInitialState,
            ...initial,
            setFilterApplicationActiveTab: value =>
                set(state => {
                    state.activeTabs[value.scope] = value.entity;
                }),
            toggleFilterApplicationValue: value =>
                set(state => {
                    toggleValue(state.values[value.scope][value.entity], value.value);
                }),
            clearFilterApplicationScopeValues: value =>
                set(state => {
                    state.values[value] = createEmptyValues();
                }),
        }))
    );
}
