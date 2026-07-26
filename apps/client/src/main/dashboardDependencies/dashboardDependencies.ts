import { metricPreviewFreshness } from '@/env/cache/freshness';
import { dashboardCodec, dashboardListCodec, valueCodec } from '@/env/cache/normalize';
import type { CacheRuntime } from '@/env/cache/runtime';
import { HttpDashboardRepo } from '@/env/repos/dashboard';
import type { HttpTransport } from '@/env/transport/http';

import { createAddDashboardChart } from '@/app/commands/addDashboardChart';
import { createAddDashboardMetric } from '@/app/commands/addDashboardMetric';
import { createCreateDashboard } from '@/app/commands/createDashboard';
import { createDeleteDashboard } from '@/app/commands/deleteDashboard';
import { createRemoveDashboardItem } from '@/app/commands/removeDashboardItem';
import { createRenameDashboard } from '@/app/commands/renameDashboard';
import { createUpdateDashboardLayout } from '@/app/commands/updateDashboardLayout';
import { createUpdateDashboardMetric } from '@/app/commands/updateDashboardMetric';
import { createGetDashboard } from '@/app/queries/getDashboard';
import { createListDashboards } from '@/app/queries/listDashboards';
import { createPreviewDashboardMetric } from '@/app/queries/previewDashboardMetric';

export function createDashboardDependencies(
    cache: CacheRuntime,
    transport: HttpTransport
) {
    const repo = new HttpDashboardRepo(transport);
    const operations = {
        listDashboards: createListDashboards(repo),
        getDashboard: createGetDashboard(repo),
        previewDashboardMetric: createPreviewDashboardMetric(repo),
        createDashboard: createCreateDashboard(repo),
        renameDashboard: createRenameDashboard(repo),
        addDashboardChart: createAddDashboardChart(repo),
        addDashboardMetric: createAddDashboardMetric(repo),
        updateDashboardMetric: createUpdateDashboardMetric(repo),
        updateDashboardLayout: createUpdateDashboardLayout(repo),
        removeDashboardItem: createRemoveDashboardItem(repo),
        deleteDashboard: createDeleteDashboard(repo),
    };
    cache.registerRead(operations.listDashboards, dashboardListCodec);
    cache.registerRead(operations.getDashboard, dashboardCodec);
    cache.registerRead(
        operations.previewDashboardMetric,
        valueCodec(),
        metricPreviewFreshness
    );
    cache.registerCommand(operations.createDashboard, {
        conflictKey: input => `dashboard:${input.orgId}/new`,
        affected: () => ['dashboard', 'dashboardItem'],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.renameDashboard, {
        conflictKey: input => `dashboard:${input.orgId}/${input.dashboardId}`,
        affected: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.addDashboardChart, {
        conflictKey: input => `dashboard:${input.orgId}/${input.dashboardId}`,
        affected: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.addDashboardMetric, {
        conflictKey: input => `dashboard:${input.orgId}/${input.dashboardId}`,
        affected: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.updateDashboardMetric, {
        conflictKey: input => `dashboard:${input.orgId}/${input.dashboardId}`,
        affected: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.updateDashboardLayout, {
        conflictKey: input => `dashboard:${input.orgId}/${input.dashboardId}`,
        affected: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.removeDashboardItem, {
        conflictKey: input => `dashboard:${input.orgId}/${input.dashboardId}`,
        affected: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
        codec: valueCodec(),
        removals: input => [
            `dashboardItem:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}/${encodeURIComponent(input.itemId)}`,
        ],
    });
    cache.registerCommand(operations.deleteDashboard, {
        conflictKey: input => `dashboard:${input.orgId}/${input.dashboardId}`,
        affected: input => [
            'dashboard',
            `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}`,
            'dashboardItem',
        ],
        codec: valueCodec(),
        removals: input => {
            const ref =
                `dashboard:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.dashboardId)}` as const;

            return [...(cache.store.get(ref)?.items ?? []), ref];
        },
    });

    return operations;
}
