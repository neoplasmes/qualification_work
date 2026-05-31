import type { Dashboard } from '@/entities/dashboard';

import { getSelected } from '@/shared/lib/getSelected';

export const getSelectedDashboard = (
    dashboards: Dashboard[] | undefined,
    selectedDashboardId: string | null
) => {
    if (selectedDashboardId === null) {
        return undefined;
    }

    return getSelected(dashboards, selectedDashboardId);
};

export const getResolvedDashboard = (
    dashboard: Dashboard | undefined,
    selectedListDashboard: Dashboard | undefined
) => {
    if (!selectedListDashboard) {
        return undefined;
    }

    return dashboard?.id === selectedListDashboard.id ? dashboard : selectedListDashboard;
};
