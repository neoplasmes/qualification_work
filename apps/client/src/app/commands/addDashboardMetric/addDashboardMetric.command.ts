import type {
    AddItemResult,
    AddMetricInput,
    DashboardRepo,
} from '@/app/ports/repos/dashboard';

import type { Command } from '../command';

export function createAddDashboardMetric(
    repo: DashboardRepo
): Command<AddMetricInput, AddItemResult> {
    return {
        execute: input => repo.addDashboardMetric(input),
        writes: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
    };
}
