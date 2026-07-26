import type { Dashboard } from '@/core/entities/dashboard';

import type { DashboardRepo, ListDashboardsInput } from '@/app/ports/repos/dashboard';

import type { Query } from '../query';

export function createListDashboards(
    repo: DashboardRepo
): Query<ListDashboardsInput, Dashboard[]> {
    return {
        name: 'listDashboards',
        execute: (input, options) => repo.listDashboards(input, options),
        reads: () => ['dashboard'],
    };
}
