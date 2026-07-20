import { useDependencies } from '@/ui/di/dependencies';
import { useLocation } from 'react-router';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import type { DashboardsPageStateStore } from '../pageState';

type State = DashboardsPageStateStore & { selectedDashboardId: string | null };
export function useDashboardsPageState<T>(selector: (state: State) => T) {
    const location = useLocation();
    const id = new URLSearchParams(location.search).get('id');

    return useStore(
        useDependencies().ui.dashboards,
        useShallow(state => selector({ ...state, selectedDashboardId: id }))
    );
}
export function useDashboardsPageActions() {
    return useDependencies().ui.dashboards.getState();
}
