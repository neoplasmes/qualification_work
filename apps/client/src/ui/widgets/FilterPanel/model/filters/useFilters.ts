import { useDependencies } from '@/ui/di/dependencies';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import type { FilterApplicationEntitiesStateStore } from './filters.store';

export function useFilters<T>(
    selector: (state: FilterApplicationEntitiesStateStore) => T
) {
    return useStore(useDependencies().ui.filters, useShallow(selector));
}
export function useFiltersActions() {
    return useDependencies().ui.filters.getState();
}
