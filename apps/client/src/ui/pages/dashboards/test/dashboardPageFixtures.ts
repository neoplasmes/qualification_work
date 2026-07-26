import type { Dashboard } from '@/core/entities/dashboard';
import type * as readModule from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import type {
    Chart,
    DatasetMetadata as DatasetMetadataFixture,
} from '@qualification-work/types';
import { vi, type Mock } from 'vitest';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

const mocks: Record<
    | 'renameDashboard'
    | 'deleteDashboard'
    | 'addDashboardChart'
    | 'addDashboardMetric'
    | 'updateDashboardMetric'
    | 'updateDashboardLayout'
    | 'removeDashboardItem'
    | 'refetchDashboards'
    | 'refetchDashboard'
    | 'listQuery'
    | 'detailQuery',
    Mock
> = vi.hoisted(() => ({
    renameDashboard: vi.fn(),
    deleteDashboard: vi.fn(),
    addDashboardChart: vi.fn(),
    addDashboardMetric: vi.fn(),
    updateDashboardMetric: vi.fn(),
    updateDashboardLayout: vi.fn(),
    removeDashboardItem: vi.fn(),
    refetchDashboards: vi.fn(),
    refetchDashboard: vi.fn(),
    listQuery: vi.fn(),
    detailQuery: vi.fn(),
}));

const chart = vi.hoisted(
    () =>
        ({
            id: 'chart-1',
            orgId: 'org-1',
            datasetId: 'dataset-1',
            name: 'Revenue',
            chartType: 'bar',
            config: {
                kind: 'bar',
                dimension: { columnId: 'column-1' },
                measures: [{ aggregate: 'count' }],
            },
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        }) satisfies Chart
);

const secondChart = vi.hoisted(
    () =>
        ({
            id: 'chart-2',
            orgId: 'org-1',
            datasetId: 'dataset-2',
            name: 'Profit',
            chartType: 'line',
            config: {
                kind: 'line',
                dimension: { columnId: 'column-profit-date' },
                measures: [{ aggregate: 'sum', columnId: 'column-profit' }],
            },
            createdAt: '2026-01-02T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
        }) satisfies Chart
);

const dashboard = vi.hoisted(
    () =>
        ({
            ref: 'dashboard:org-1/dashboard-1',
            id: 'dashboard-1',
            orgId: 'org-1',
            name: 'Sales',
            items: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        }) satisfies Dashboard
);

const dataset = vi.hoisted(
    () =>
        ({
            dataset: {
                ref: 'dataset:org-1/dataset-1',
                id: 'dataset-1',
                orgId: 'org-1',
                name: 'Invoices',
                sourceType: 'manual',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
            columns: [
                {
                    ref: 'datasetColumn:org-1/dataset-1/column-score',
                    id: 'column-score',
                    datasetId: 'dataset-1',
                    key: 'score',
                    displayName: 'Score',
                    dataType: 'number',
                    orderIndex: 0,
                    isAnalyzable: true,
                },
            ],
            totalRows: 3,
        }) satisfies DatasetMetadata
);

const secondDataset = vi.hoisted(
    () =>
        ({
            dataset: {
                ref: 'dataset:org-1/dataset-2',
                id: 'dataset-2',
                orgId: 'org-1',
                name: 'Profit reports',
                sourceType: 'manual',
                createdAt: '2026-01-02T00:00:00.000Z',
                updatedAt: '2026-01-02T00:00:00.000Z',
            },
            columns: [
                {
                    ref: 'datasetColumn:org-1/dataset-2/column-profit',
                    id: 'column-profit',
                    datasetId: 'dataset-2',
                    key: 'profit',
                    displayName: 'Profit',
                    dataType: 'number',
                    orderIndex: 0,
                    isAnalyzable: true,
                },
                {
                    ref: 'datasetColumn:org-1/dataset-2/column-profit-date',
                    id: 'column-profit-date',
                    datasetId: 'dataset-2',
                    key: 'created_at',
                    displayName: 'Created at',
                    dataType: 'date',
                    orderIndex: 1,
                    isAnalyzable: true,
                },
            ],
            totalRows: 5,
        }) satisfies DatasetMetadata
);

vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: { id: 'user-1' } }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: 'owner' },
    }),
}));

vi.mock('@/env/cache/useRead', async importOriginal => {
    const actual = await importOriginal<typeof readModule>();

    return {
        ...actual,
        useRead: (query: { name: string }, input: unknown, options: unknown) => {
            if (query.name === 'listDashboards') {
                return mocks.listQuery() ?? { data: [dashboard], isPending: false };
            }
            if (query.name === 'getDashboard') {
                const id = (input as { dashboardId: string }).dashboardId || undefined;

                return (
                    mocks.detailQuery(id) ?? {
                        data: id ? dashboard : undefined,
                        isPending: false,
                    }
                );
            }
            if (query.name === 'previewDashboardMetric') {
                return { data: { value: 12.5 }, isFetching: false };
            }
            if (query.name === 'listCharts') {
                return {
                    data: [chart, secondChart],
                    isLoading: false,
                    isFetching: false,
                    refetch: vi.fn(),
                    isPending: false,
                };
            }
            if (query.name === 'getChartData') {
                return {
                    data: undefined,
                    isPending: false,
                    isFetching: false,
                    error: null,
                };
            }

            return actual.useRead(query as never, input, options as never);
        },
    };
});

export const datasetMetadataFixtures: DatasetMetadataFixture[] = [dataset, secondDataset];

vi.mock('@/env/cache/useCommand', () => ({
    useCommand: (command: unknown) => {
        const dependencies = useDependencies();
        if (command === dependencies.renameDashboard) {
            return {
                executeOutcome: async (input: unknown) => ({
                    data: await mocks.renameDashboard(input).unwrap(),
                }),
                isPending: false,
            };
        }
        if (command === dependencies.deleteDashboard) {
            return {
                executeOutcome: async (input: unknown) => ({
                    data: await mocks.deleteDashboard(input).unwrap(),
                }),
                isPending: false,
            };
        }
        if (command === dependencies.addDashboardChart) {
            return {
                executeOutcome: async (input: unknown) => {
                    const outcome = mocks.addDashboardChart(input);

                    return { data: await outcome.unwrap(), syncError: outcome.syncError };
                },
                isPending: false,
            };
        }
        if (command === dependencies.addDashboardMetric) {
            return {
                executeOutcome: async (input: unknown) => ({
                    data: await mocks.addDashboardMetric(input).unwrap(),
                }),
                isPending: false,
            };
        }
        if (command === dependencies.updateDashboardMetric) {
            return {
                executeOutcome: async (input: unknown) => ({
                    data: await mocks.updateDashboardMetric(input).unwrap(),
                }),
                isPending: false,
            };
        }
        if (command === dependencies.updateDashboardLayout) {
            return {
                executeOutcome: async (input: unknown) => ({
                    data: await mocks.updateDashboardLayout(input).unwrap(),
                }),
                isPending: false,
            };
        }
        if (command === dependencies.removeDashboardItem) {
            return {
                executeOutcome: async (input: unknown) => ({
                    data: await mocks.removeDashboardItem(input).unwrap(),
                }),
                isPending: false,
            };
        }

        throw new Error('Unexpected command');
    },
}));

export { mocks, dashboard, dataset, secondDataset };
