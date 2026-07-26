import type {
    CreateDashboardInput,
    CreateDashboardResult,
    DashboardRepo,
} from '@/app/ports/repos/dashboard';

import type { Command } from '../command';

export function createCreateDashboard(
    repo: DashboardRepo
): Command<CreateDashboardInput, CreateDashboardResult> {
    return {
        execute: input => repo.createDashboard(input),
        writes: (input, output) => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(output.id)}`,
            'dashboardItem',
        ],
    };
}
