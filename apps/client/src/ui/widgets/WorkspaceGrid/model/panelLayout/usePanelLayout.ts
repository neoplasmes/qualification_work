import { useDependencies } from '@/ui/di/dependencies';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import type { PanelLayoutStateStore } from './panelLayout.store';

export function usePanelLayout<T>(selector: (state: PanelLayoutStateStore) => T) {
    return useStore(useDependencies().ui.panelLayout, useShallow(selector));
}
export function usePanelLayoutActions() {
    return useDependencies().ui.panelLayout.getState();
}
