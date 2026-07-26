import type { DashboardRepo, DashboardScope } from '@/app/ports/repos/dashboard';

import type { Command } from '../command';

export function createDeleteDashboard(
    repo: DashboardRepo
): Command<DashboardScope, void> {
    return {
        execute: input => repo.deleteDashboard(input),
        writes: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
    };
}
