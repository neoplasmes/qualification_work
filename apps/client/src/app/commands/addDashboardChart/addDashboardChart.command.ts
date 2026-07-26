import type {
    AddChartInput,
    AddItemResult,
    DashboardRepo,
} from '@/app/ports/repos/dashboard';

import type { Command } from '../command';

export function createAddDashboardChart(
    repo: DashboardRepo
): Command<AddChartInput, AddItemResult> {
    return {
        execute: input => repo.addDashboardChart(input),
        writes: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
    };
}
