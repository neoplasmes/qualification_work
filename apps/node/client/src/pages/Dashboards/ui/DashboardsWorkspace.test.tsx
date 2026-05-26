import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
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
    reorderDashboardItems: vi.fn(),
    removeDashboardItem: vi.fn(),
    refetchDashboards: vi.fn(),
    refetchDashboard: vi.fn(),
}));

const chart = vi.hoisted(
    () =>
        ({
            id: 'chart-1',
            orgId: 'org-1',
            datasetId: 'dataset-1',
            name: 'Revenue',
            chartType: 'bar',
            config: {},
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
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
            columns: [],
            totalRows: 3,
        }) satisfies DatasetMetadata
);

vi.mock('@/features/authenticate', () => ({
    useGetMeQuery: () => ({ data: { id: 'user-1' } }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: 'owner' },
    }),
}));

vi.mock('@/entities/chart', () => ({
    useListChartsQuery: () => ({
        data: [chart],
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
    }),
    useLazyGetChartDataQuery: () => [vi.fn(), { data: null, isFetching: false }],
}));

vi.mock('@/entities/dataset', () => ({
    useListDatasetsQuery: () => ({
        data: [dataset],
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
    useReorderDashboardItemsMutation: () => [
        mocks.reorderDashboardItems,
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
    const element = container.querySelector<T>(`[data-test-id="${testId}"]`);
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
                <DashboardsWorkspace />
            </Provider>
        ),
    };
};

describe('DashboardsWorkspace', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.renameDashboard.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
        mocks.addDashboardChart.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({ itemId: 'item-1', posY: 0 }),
        });
        mocks.addDashboardMetric.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({ itemId: 'item-2', posY: 1 }),
        });
        mocks.refetchDashboards.mockResolvedValue(undefined);
        mocks.refetchDashboard.mockResolvedValue(undefined);
    });

    it('renames dashboard from workspace form', async () => {
        const user = userEvent.setup();
        const { container } = renderWorkspace();
        const nameInput = getByDataTestId<HTMLInputElement>(
            container,
            dashboardsTestIds.renameInput
        );

        await user.clear(nameInput);
        await user.type(nameInput, 'Operations');
        await user.click(getByDataTestId(container, dashboardsTestIds.saveNameButton));

        await waitFor(() => expect(mocks.renameDashboard).toHaveBeenCalledTimes(1));
        expect(mocks.renameDashboard).toHaveBeenCalledWith({
            dashboardId: 'dashboard-1',
            name: 'Operations',
        });
    });

    it('adds chart and metric widgets from central controls', async () => {
        const user = userEvent.setup();
        const { container } = renderWorkspace();

        await user.click(getByDataTestId(container, dashboardsTestIds.addChartButton));
        await user.type(
            getByDataTestId(container, dashboardsTestIds.metricNameInput),
            'Average'
        );
        await user.type(
            getByDataTestId(container, dashboardsTestIds.metricExpressionInput),
            'avg(score)'
        );
        await user.selectOptions(
            getByDataTestId(container, dashboardsTestIds.metricFormatSelect),
            'percent'
        );
        await user.click(getByDataTestId(container, dashboardsTestIds.addMetricButton));

        await waitFor(() => expect(mocks.addDashboardChart).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(mocks.addDashboardMetric).toHaveBeenCalledTimes(1));
        expect(mocks.addDashboardChart).toHaveBeenCalledWith({
            dashboardId: 'dashboard-1',
            chartId: 'chart-1',
            height: 8,
        });
        expect(mocks.addDashboardMetric).toHaveBeenCalledWith({
            dashboardId: 'dashboard-1',
            datasetId: 'dataset-1',
            name: 'Average',
            expression: 'avg(score)',
            format: 'percent',
            height: 4,
        });
    });
});
