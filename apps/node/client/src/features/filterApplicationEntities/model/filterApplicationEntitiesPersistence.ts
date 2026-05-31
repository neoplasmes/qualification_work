import type { FilterApplicationEntitiesState } from '../types';
import { filterApplicationEntitiesInitialState } from './filterApplicationEntitiesSlice';

type FilterApplicationEntitiesPersisted = Pick<
    FilterApplicationEntitiesState,
    'activeTabs' | 'values'
>;

export const filterApplicationEntitiesPersistence = {
    key: 'filterApplicationEntities_v3',
    fallbackState:
        filterApplicationEntitiesInitialState satisfies FilterApplicationEntitiesPersisted,
    getInitialState: (
        persistedState: FilterApplicationEntitiesPersisted
    ): FilterApplicationEntitiesState => persistedState,
    pickPersistedState: (
        state: FilterApplicationEntitiesState
    ): FilterApplicationEntitiesPersisted => ({
        activeTabs: state.activeTabs,
        values: state.values,
    }),
};
