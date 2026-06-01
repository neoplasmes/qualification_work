import { dashboardChartDefaultHeight } from '@qualification-work/types';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Chart } from '@/entities/chart';
import type { Dashboard } from '@/entities/dashboard';
import type { DatasetMetadata } from '@/entities/dataset';

import { dashboardsTestIds } from '../const';
import { dashboardsPageInitialState, dashboardsPageSlice } from '../model';
import { DashboardsWorkspace } from './DashboardsWorkspace';

const mocks = vi.hoisted(() => ({
    renameDashboard: vi.fn(),
    deleteDashboard: vi.fn(),
    addDashboardChart: vi.fn(),
    addDashboardMetric: vi.fn(),
    updateDashboardMetric: vi.fn(),
    updateDashboardLayout: vi.fn(),
    removeDashboardItem: vi.fn(),
    refetchDashboards: vi.fn(),
    refetchDashboard: vi.fn(),
}));

const chartIconMock = vi.hoisted(() => () => null);

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
                id: 'dataset-1',
                orgId: 'org-1',
                name: 'Invoices',
                sourceType: 'manual',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
            columns: [
                {
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
                id: 'dataset-2',
                orgId: 'org-1',
                name: 'Profit reports',
                sourceType: 'manual',
                createdAt: '2026-01-02T00:00:00.000Z',
                updatedAt: '2026-01-02T00:00:00.000Z',
            },
            columns: [
                {
                    id: 'column-profit',
                    datasetId: 'dataset-2',
                    key: 'profit',
                    displayName: 'Profit',
                    dataType: 'number',
                    orderIndex: 0,
                    isAnalyzable: true,
                },
                {
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

vi.mock('@/features/authenticate', () => ({
    useGetMeQuery: () => ({ data: { id: 'user-1' } }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: 'owner' },
    }),
}));

vi.mock('@/entities/chart', () => ({
    CHART_KIND_ICONS: {
        bar: chartIconMock,
        line: chartIconMock,
        pie: chartIconMock,
        heatmap: chartIconMock,
    },
    useListChartsQuery: () => ({
        data: [chart, secondChart],
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
    }),
    useGetChartDataQuery: () => ({
        currentData: undefined,
        isLoading: false,
        isFetching: false,
        isError: false,
    }),
    useLazyGetChartDataQuery: () => [vi.fn(), { data: null, isFetching: false }],
}));

vi.mock('@/entities/dataset', () => ({
    useListDatasetsQuery: () => ({
        data: [dataset, secondDataset],
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
    }),
}));

vi.mock('@/entities/dashboard', () => ({
    useListDashboardsQuery: () => ({
        data: [dashboard],
        isLoading: false,
        isFetching: false,
        refetch: mocks.refetchDashboards,
    }),
    useGetDashboardQuery: () => ({
        data: dashboard,
        isLoading: false,
        isFetching: false,
        refetch: mocks.refetchDashboard,
    }),
    useDeleteDashboardMutation: () => [mocks.deleteDashboard, { isLoading: false }],
}));

vi.mock('@/features/manageDashboards', () => ({
    useRenameDashboardMutation: () => [mocks.renameDashboard, { isLoading: false }],
    useAddDashboardChartMutation: () => [mocks.addDashboardChart, { isLoading: false }],
    useAddDashboardMetricMutation: () => [mocks.addDashboardMetric, { isLoading: false }],
    usePreviewDashboardMetricQuery: () => ({
        data: { value: 12.5 },
        isFetching: false,
        error: undefined,
    }),
    useUpdateDashboardMetricMutation: () => [
        mocks.updateDashboardMetric,
        { isLoading: false },
    ],
    useUpdateDashboardLayoutMutation: () => [
        mocks.updateDashboardLayout,
        { isLoading: false },
    ],
    useRemoveDashboardItemMutation: () => [
        mocks.removeDashboardItem,
        { isLoading: false },
    ],
}));

const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element =
        container.querySelector<T>(`[data-test-id="${testId}"]`) ??
        document.body.querySelector<T>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as T;
};

const renderWorkspace = () => {
    const store = configureStore({
        reducer: combineReducers({
            [dashboardsPageSlice.name]: dashboardsPageSlice.reducer,
        }),
        preloadedState: {
            [dashboardsPageSlice.name]: {
                ...dashboardsPageInitialState,
                selectedDashboardId: 'dashboard-1',
            },
        },
    });

    return {
        store,
        ...render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/dashboards?id=dashboard-1']}>
                    <DashboardsWorkspace />
                </MemoryRouter>
            </Provider>
        ),
    };
};

describe('DashboardsWorkspace', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        dashboard.items = [];
        mocks.renameDashboard.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
        mocks.addDashboardChart.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({ itemId: 'item-1', posY: 0 }),
        });
        mocks.addDashboardMetric.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({ itemId: 'item-2', posY: 1 }),
        });
        mocks.updateDashboardMetric.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
        mocks.refetchDashboards.mockResolvedValue(undefined);
        mocks.refetchDashboard.mockResolvedValue(undefined);
    });

    it('keeps dashboard title editing out of the central workspace', () => {
        const { container } = renderWorkspace();

        expect(
            container.querySelector(`[data-test-id="${dashboardsTestIds.renameButton}"]`)
        ).toBeNull();
    });

    it('renders add widget actions without workspace mode tabs', () => {
        const { container } = renderWorkspace();

        expect(
            container.querySelector(
                `[data-test-id="${dashboardsTestIds.workspaceViewTab}"]`
            )
        ).toBeNull();
        expect(
            container.querySelector(
                `[data-test-id="${dashboardsTestIds.workspaceEditTab}"]`
            )
        ).toBeNull();
        expect(
            getByDataTestId(container, dashboardsTestIds.openAddMetricModalButton)
        ).toBeInTheDocument();
        expect(
            getByDataTestId(container, dashboardsTestIds.openAddChartModalButton)
        ).toBeInTheDocument();
    });

    it('keeps manually edited metric name when builder changes', async () => {
        const user = userEvent.setup();
        const { container } = renderWorkspace();

        await user.click(
            getByDataTestId(container, dashboardsTestIds.openAddMetricModalButton)
        );

        const nameInput = getByDataTestId<HTMLInputElement>(
            container,
            dashboardsTestIds.metricNameInput
        );

        await waitFor(() => expect(nameInput).toHaveValue('Average Score'));
        await user.clear(nameInput);
        await user.type(nameInput, 'Manual metric');
        await user.selectOptions(
            getByDataTestId(container, dashboardsTestIds.metricAggregateSelect),
            'sum'
        );

        await waitFor(() => expect(nameInput).toHaveValue('Manual metric'));
        expect(
            getByDataTestId(container, dashboardsTestIds.metricExpressionInput)
        ).toHaveValue('sum(score)');
    });

    it('adds chart and metric widgets from modals', async () => {
        const user = userEvent.setup();
        const { container } = renderWorkspace();

        await user.click(
            getByDataTestId(container, dashboardsTestIds.openAddChartModalButton)
        );
        expect(screen.getByRole('dialog', { name: 'Add chart' })).toBeInTheDocument();
        expect(
            getByDataTestId<HTMLSelectElement>(
                document.body,
                dashboardsTestIds.addChartDatasetSelect
            )
        ).toHaveValue('');
        await user.click(screen.getByRole('button', { name: /Revenue/ }));
        await user.selectOptions(
            getByDataTestId(document.body, dashboardsTestIds.addChartDatasetSelect),
            'dataset-2'
        );
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /Profit/ }));
        await user.click(getByDataTestId(container, dashboardsTestIds.addChartButton));

        await waitFor(() => expect(mocks.addDashboardChart).toHaveBeenCalledTimes(2));

        await user.click(
            getByDataTestId(container, dashboardsTestIds.openAddMetricModalButton)
        );
        expect(screen.getByRole('dialog', { name: 'Add metric' })).toBeInTheDocument();
        await waitFor(() =>
            expect(
                getByDataTestId(container, dashboardsTestIds.metricNameInput)
            ).toHaveValue('Average Score')
        );
        expect(
            getByDataTestId(container, dashboardsTestIds.metricPreviewValue)
        ).toHaveTextContent('12,5');
        const formatInput = getByDataTestId<HTMLInputElement>(
            container,
            dashboardsTestIds.metricFormatSelect
        );
        const valueMultiplierInput = getByDataTestId<HTMLInputElement>(
            container,
            dashboardsTestIds.metricValueMultiplierInput
        );
        const valueMultiplierSlider = screen.getByRole('slider', {
            name: 'Multiplier',
        });
        fireEvent.change(valueMultiplierSlider, { target: { value: '12.5' } });
        expect(valueMultiplierInput).toHaveValue(12.5);
        await user.clear(valueMultiplierInput);
        await user.type(valueMultiplierInput, '1');
        await user.clear(formatInput);
        await user.type(formatInput, '%');
        expect(valueMultiplierInput).toHaveValue(100);

        await user.click(getByDataTestId(container, dashboardsTestIds.addMetricButton));

        await waitFor(() => expect(mocks.addDashboardMetric).toHaveBeenCalledTimes(1));
        expect(mocks.addDashboardChart).toHaveBeenNthCalledWith(1, {
            dashboardId: 'dashboard-1',
            chartId: 'chart-1',
            height: dashboardChartDefaultHeight,
        });
        expect(mocks.addDashboardChart).toHaveBeenNthCalledWith(2, {
            dashboardId: 'dashboard-1',
            chartId: 'chart-2',
            height: dashboardChartDefaultHeight,
        });
        expect(mocks.addDashboardMetric).toHaveBeenCalledWith({
            dashboardId: 'dashboard-1',
            datasetId: 'dataset-1',
            name: 'Average Score',
            expression: 'avg(score)',
            format: '%',
            valueMultiplier: 100,
            target: null,
            targetDirection: null,
            showTrend: false,
            timeColumn: null,
            timeBucket: null,
        });
    });

    it('shows add metric errors inside the modal', async () => {
        const user = userEvent.setup();
        mocks.addDashboardMetric.mockReturnValueOnce({
            unwrap: vi.fn().mockRejectedValue({
                data: { error: 'bind message supplies 2 parameters' },
            }),
        });
        const { container } = renderWorkspace();

        await user.click(
            getByDataTestId(container, dashboardsTestIds.openAddMetricModalButton)
        );
        await user.click(getByDataTestId(container, dashboardsTestIds.addMetricButton));

        const alert = await screen.findByRole('alert');
        const dialog = screen.getByRole('dialog', { name: 'Add metric' });

        expect(alert).toHaveTextContent('bind message supplies 2 parameters');
        expect(dialog).toContainElement(alert);
    });
});
