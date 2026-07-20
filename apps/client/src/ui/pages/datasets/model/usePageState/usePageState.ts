import { useDependencies } from '@/ui/di/dependencies';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import type { DatasetsPageStateStore } from '../pageState';

export function useDatasetsPageState<T>(selector: (state: DatasetsPageStateStore) => T) {
    return useStore(useDependencies().ui.datasets, useShallow(selector));
}
export function useDatasetsPageActions() {
    return useDependencies().ui.datasets.getState();
}
