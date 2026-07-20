import { describe, expect, it } from 'vitest';

import { filterApplicationEntitiesPersistence } from './filters.persistence';
import {
    createFiltersStore,
    filterApplicationEntitiesInitialState,
} from './filters.store';

describe('createFiltersStore', () => {
    it('switches active tabs and toggles values by scope', () => {
        const store = createFiltersStore(filterApplicationEntitiesInitialState);
        store.getState().setFilterApplicationActiveTab({
            scope: 'charts',
            entity: 'dashboards',
        });

        let state = store.getState();
        store.getState().toggleFilterApplicationValue({
            scope: 'charts',
            entity: 'dashboards',
            value: 'dashboard-1',
        });

        state = store.getState();

        expect(state.activeTabs.charts).toBe('dashboards');
        expect(state.values.charts.dashboards).toEqual(['dashboard-1']);

        store.getState().toggleFilterApplicationValue({
            scope: 'charts',
            entity: 'dashboards',
            value: 'dashboard-1',
        });

        state = store.getState();

        expect(state.values.charts.dashboards).toEqual([]);
    });

    it('clears all values in selected scope', () => {
        const store = createFiltersStore(filterApplicationEntitiesInitialState);
        store.getState().toggleFilterApplicationValue({
            scope: 'dashboards',
            entity: 'charts',
            value: 'chart-1',
        });

        let state = store.getState();
        store.getState().toggleFilterApplicationValue({
            scope: 'dashboards',
            entity: 'datasets',
            value: 'dataset-1',
        });

        state = store.getState();
        store.getState().clearFilterApplicationScopeValues('dashboards');

        state = store.getState();

        expect(state.values.dashboards.charts).toEqual([]);
        expect(state.values.dashboards.datasets).toEqual([]);
    });

    it('hydrates the current persisted schema without patching it', () => {
        const persistedState = {
            activeTabs: {
                ...filterApplicationEntitiesInitialState.activeTabs,
                datasets: 'dashboards',
            },
            values: {
                ...filterApplicationEntitiesInitialState.values,
                datasets: {
                    ...filterApplicationEntitiesInitialState.values.datasets,
                    dashboards: ['dashboard-1'],
                },
            },
        } satisfies Parameters<
            typeof filterApplicationEntitiesPersistence.getInitialState
        >[0];
        const state =
            filterApplicationEntitiesPersistence.getInitialState(persistedState);

        expect(state).toBe(persistedState);
        expect(state.activeTabs.datasets).toBe('dashboards');
        expect(state.values.datasets.dashboards).toEqual(['dashboard-1']);
    });
});

it('isolates editor instances', () => {
    const firstStore = createFiltersStore();
    const secondStore = createFiltersStore();
    const initial = secondStore.getState();
    firstStore.getState().toggleFilterApplicationValue({
        scope: 'charts',
        entity: 'datasets',
        value: 'one',
    });
    expect(secondStore.getState()).toEqual(initial);
});
