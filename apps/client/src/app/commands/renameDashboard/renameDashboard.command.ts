import type { DashboardRepo, RenameDashboardInput } from '@/app/ports/repos/dashboard';

import type { Command } from '../command';

export function createRenameDashboard(
    repo: DashboardRepo
): Command<RenameDashboardInput, void> {
    return {
        execute: input => repo.renameDashboard(input),
        writes: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
    };
}
