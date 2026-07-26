import type { DashboardRepo, UpdateMetricInput } from '@/app/ports/repos/dashboard';

import type { Command } from '../command';

export function createUpdateDashboardMetric(
    repo: DashboardRepo
): Command<UpdateMetricInput, void> {
    return {
        execute: input => repo.updateDashboardMetric(input),
        writes: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
    };
}
