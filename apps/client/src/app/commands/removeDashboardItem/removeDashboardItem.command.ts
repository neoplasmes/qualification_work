import type { DashboardItemScope, DashboardRepo } from '@/app/ports/repos/dashboard';

import type { Command } from '../command';

export function createRemoveDashboardItem(
    repo: DashboardRepo
): Command<DashboardItemScope, void> {
    return {
        execute: input => repo.removeDashboardItem(input),
        writes: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
    };
}
