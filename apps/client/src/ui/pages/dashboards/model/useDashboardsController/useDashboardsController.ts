import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { useActiveOrganization, useSession } from '@/ui/session';

import { useDashboardsPageState } from '../usePageState';

export function useDashboardsController() {
    const dependencies = useDependencies();
    const { activeOrg: org } = useActiveOrganization(useSession().data);
    const selectedDashboardId = useDashboardsPageState(
        state => state.selectedDashboardId
    );
    const orgId = org?.id ?? '';
    const dashboardsQuery = useRead(
        dependencies.listDashboards,
        { orgId },
        { enabled: Boolean(orgId) }
    );
    const selectedListDashboard = dashboardsQuery.data?.find(
        item => item.id === selectedDashboardId
    );
    const dashboardId = selectedListDashboard?.id ?? '';
    const dashboardQuery = useRead(
        dependencies.getDashboard,
        { orgId, dashboardId },
        { enabled: Boolean(orgId && dashboardId) }
    );

    return {
        dependencies,
        org,
        orgId,
        selectedDashboardId,
        selectedListDashboard,
        dashboardsQuery,
        dashboardQuery,
        dashboard: dashboardId ? dashboardQuery.data : undefined,
    };
}
