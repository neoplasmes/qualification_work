import { describe, expect, it } from 'vitest';

import {
    clearFilterApplicationValues,
    filterApplicationEntitiesInitialState,
    filterApplicationEntitiesPersistence,
    filterApplicationEntitiesSlice,
    setFilterApplicationActiveTab,
    toggleFilterApplicationValue,
} from './index';

describe('filterApplicationEntitiesSlice', () => {
    it('switches active tabs and toggles values by scope', () => {
        let state = filterApplicationEntitiesSlice.reducer(
            filterApplicationEntitiesInitialState,
            setFilterApplicationActiveTab({
                scope: 'charts',
                entity: 'dashboards',
            })
        );
        state = filterApplicationEntitiesSlice.reducer(
            state,
            toggleFilterApplicationValue({
                scope: 'charts',
                entity: 'dashboards',
                value: 'dashboard-1',
            })
        );

        expect(state.activeTabs.charts).toBe('dashboards');
        expect(state.values.charts.dashboards).toEqual(['dashboard-1']);

        state = filterApplicationEntitiesSlice.reducer(
            state,
            toggleFilterApplicationValue({
                scope: 'charts',
                entity: 'dashboards',
                value: 'dashboard-1',
            })
        );

        expect(state.values.charts.dashboards).toEqual([]);
    });

    it('clears only selected entity values', () => {
        let state = filterApplicationEntitiesSlice.reducer(
            filterApplicationEntitiesInitialState,
            toggleFilterApplicationValue({
                scope: 'dashboards',
                entity: 'charts',
                value: 'chart-1',
            })
        );
        state = filterApplicationEntitiesSlice.reducer(
            state,
            toggleFilterApplicationValue({
                scope: 'dashboards',
                entity: 'datasets',
                value: 'dataset-1',
            })
        );
        state = filterApplicationEntitiesSlice.reducer(
            state,
            clearFilterApplicationValues({
                scope: 'dashboards',
                entity: 'charts',
            })
        );

        expect(state.values.dashboards.charts).toEqual([]);
        expect(state.values.dashboards.datasets).toEqual(['dataset-1']);
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
