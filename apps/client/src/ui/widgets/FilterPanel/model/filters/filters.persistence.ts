import type { FilterApplicationEntitiesState } from '@/core/processes/entityFiltering';

import { filterApplicationEntitiesInitialState } from './filters.store';

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
