import type { DashboardRepo, UpdateLayoutInput } from '@/app/ports/repos/dashboard';

import type { Command } from '../command';

export function createUpdateDashboardLayout(
    repo: DashboardRepo
): Command<UpdateLayoutInput, void> {
    return {
        execute: input => repo.updateDashboardLayout(input),
        writes: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
    };
}
