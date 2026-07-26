import type { Dashboard } from '@/core/entities/dashboard';

import type { DashboardRepo, DashboardScope } from '@/app/ports/repos/dashboard';

import type { Query } from '../query';

export function createGetDashboard(
    repo: DashboardRepo
): Query<DashboardScope, Dashboard> {
    return {
        name: 'getDashboard',
        execute: (input, options) => repo.getDashboard(input, options),
        reads: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
        ],
    };
}
