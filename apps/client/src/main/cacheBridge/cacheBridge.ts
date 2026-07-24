import type { EntityRef } from '@/core/entities/entityRef';
import type { CacheRuntime } from '@/env/cache/runtime';
import type { Middleware, UnknownAction } from '@reduxjs/toolkit';

import { api } from '@/shared/api';

const metadataReads = ['listDatasets', 'getDatasetMetadata'];
const contentReads = [
    ...metadataReads,
    'getDatasetRows',
    'listCharts',
    'getChart',
    'getChartData',
    'previewChartData',
    'previewDashboardMetric',
    'listDashboards',
    'getDashboard',
];
const dashboardReads = ['listDashboards', 'getDashboard', 'previewDashboardMetric'];
const actionReads = ['listActions', 'getAction'];
const targets: Record<string, readonly string[]> = {
    createAction: actionReads,
    updateAction: actionReads,
    patchAction: actionReads,
    archiveAction: actionReads,
    executeAction: ['listActionRuns', ...contentReads],
    createDashboard: dashboardReads,
    renameDashboard: dashboardReads,
    addDashboardChart: dashboardReads,
    addDashboardMetric: dashboardReads,
    updateDashboardMetric: dashboardReads,
    updateDashboardLayout: dashboardReads,
    removeDashboardItem: dashboardReads,
    deleteDashboard: dashboardReads,
};
const familyTags: Partial<
    Record<EntityRef, Parameters<typeof api.util.invalidateTags>[0]>
> = {
    dataset: ['Datasets'],
    datasetColumn: ['Datasets'],
    datasetRow: ['DatasetRows'],
    metricPreview: ['Dashboards'],
    dashboard: ['Dashboards'],
    dashboardItem: ['Dashboards'],
    action: ['Actions'],
    actionRun: ['ActionRuns'],
};

export function createCacheBridge(cache: CacheRuntime, report: (error: unknown) => void) {
    let closed = false;
    let dispatch: ((action: UnknownAction) => unknown) | undefined;
    const pending = new Map<string, number>();
    const middleware: Middleware = () => next => action => {
        const result = next(action);
        if (
            closed ||
            !action ||
            typeof action !== 'object' ||
            !('type' in action) ||
            !('meta' in action)
        ) {
            return result;
        }
        const event = action as {
            type: string;
            meta: {
                requestId?: string;
                arg?: { endpointName?: string; originalArgs?: unknown };
            };
        };
        const name = event.meta?.arg?.endpointName;
        const id = event.meta?.requestId;
        if (!id || !name || !targets[name]) {
            return result;
        }
        if (event.type === `${api.reducerPath}/executeMutation/pending`) {
            pending.set(id, cache.epoch);

            return result;
        }
        if (
            ![
                `${api.reducerPath}/executeMutation/fulfilled`,
                `${api.reducerPath}/executeMutation/rejected`,
            ].includes(event.type)
        ) {
            return result;
        }
        const epoch = pending.get(id);
        pending.delete(id);
        if (
            event.type !== `${api.reducerPath}/executeMutation/fulfilled` ||
            epoch === undefined ||
            epoch !== cache.epoch
        ) {
            return result;
        }
        const input = event.meta.arg?.originalArgs;
        const args =
            input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
        const names = targets[name]!;
        const refs = new Set<EntityRef>();
        for (const query of cache.queryClient.getQueryCache().getAll()) {
            if (
                query.meta?.normalizedRead !== true ||
                !names.includes(String(query.queryKey[0]))
            ) {
                continue;
            }
            const scope = query.queryKey[1];
            if (
                typeof args.orgId === 'string' &&
                scope &&
                typeof scope === 'object' &&
                'orgId' in scope &&
                scope.orgId !== args.orgId
            ) {
                continue;
            }
            for (const ref of query.meta.dependencies as EntityRef[]) {
                refs.add(ref);
            }
        }
        void cache.invalidator.invalidate([...refs], { epoch }).catch(error => {
            if (!closed && epoch === cache.epoch) {
                report(error);
            }
        });

        return result;
    };

    return {
        middleware,
        attach(value: (action: UnknownAction) => unknown) {
            dispatch = value;
        },
        confirmed({ refs, epoch }: { refs: readonly EntityRef[]; epoch: number }) {
            if (closed || epoch !== cache.epoch) {
                return;
            }
            const tags = [...new Set(refs.flatMap(ref => familyTags[ref] ?? []))];
            if (tags.length) {
                dispatch?.(api.util.invalidateTags(tags));
            }
        },
        reset() {
            pending.clear();
        },
        dispose() {
            closed = true;
            pending.clear();
            dispatch = undefined;
        },
    };
}
