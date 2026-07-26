import './test';

import { createUiTestRuntime, UiTestProvider as Provider } from '@/test/uiRuntime';
import { dashboardChartDefaultHeight } from '@qualification-work/types';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore, useStore } from 'zustand';

import { dashboardsTestIds } from './const';
import { DashboardsPage } from './Dashboards.page';
import { dashboardsPageInitialState } from './model';
import { dashboard, datasetMetadataFixtures, mocks } from './test';

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
    const store = createUiTestRuntime({
        datasetMetadata: datasetMetadataFixtures,
        dashboards: {
            ...dashboardsPageInitialState,
            rememberedDashboardId: 'dashboard-1',
        },
    });

    return {
        store,
        ...render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/dashboards?id=dashboard-1']}>
                    <DashboardsPage />
                </MemoryRouter>
            </Provider>
        ),
    };
};

describe('DashboardsPage', () => {
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
            orgId: 'org-1',
            dashboardId: 'dashboard-1',
            chartId: 'chart-1',
            height: dashboardChartDefaultHeight,
        });
        expect(mocks.addDashboardChart).toHaveBeenNthCalledWith(2, {
            orgId: 'org-1',
            dashboardId: 'dashboard-1',
            chartId: 'chart-2',
            height: dashboardChartDefaultHeight,
        });
        expect(mocks.addDashboardMetric).toHaveBeenCalledWith({
            height: 4,
            orgId: 'org-1',
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

afterEach(() => {
    mocks.listQuery.mockReset();
    mocks.detailQuery.mockReset();
});

it.each([
    { lateHydration: false, delayedList: false },
    { lateHydration: true, delayedList: false },
    { lateHydration: false, delayedList: true },
    { lateHydration: true, delayedList: true },
])(
    'preserves persisted draft on resume (late hydration: $lateHydration, delayed list: $delayedList)',
    async ({ lateHydration, delayedList }) => {
        const queries = createStore<{
            list: 'loading' | 'error' | 'ready';
            detail: 'loading' | 'error' | 'ready';
        }>(() => ({
            list: delayedList ? 'loading' : 'ready',
            detail: delayedList ? 'loading' : 'ready',
        }));
        mocks.listQuery.mockImplementation(() => {
            const status = useStore(queries, state => state.list);

            return {
                data: status === 'ready' ? [dashboard] : undefined,
                isLoading: status === 'loading',
                isFetching: status === 'loading',
                error: status === 'error' ? { status: 503 } : undefined,
                refetch: mocks.refetchDashboards,
            };
        });
        mocks.detailQuery.mockImplementation((id: unknown) => {
            const status = useStore(queries, state => state.detail);
            const data =
                typeof id === 'string' && status === 'ready' ? dashboard : undefined;

            return {
                data,
                currentData: data,
                isLoading: typeof id === 'string' && status === 'loading',
                isFetching: typeof id === 'string' && status === 'loading',
                error: status === 'error' ? { status: 503 } : undefined,
                refetch: mocks.refetchDashboard,
            };
        });
        localStorage.clear();
        const persisted = {
            selectedDashboardId: 'dashboard-1',
            workspaceDraftDashboardId: 'dashboard-1',
            workspaceDraftName: 'Unsaved local name',
        };
        localStorage.setItem('dashboardsPage_v1', JSON.stringify(persisted));
        const store = createUiTestRuntime(
            { datasetMetadata: datasetMetadataFixtures },
            true
        );
        if (!lateHydration) {
            store.ui.hydrate();
        }
        const router = createMemoryRouter(
            [
                { path: '/datasets', element: <div>Tables</div> },
                { path: '/dashboards', element: <DashboardsPage /> },
            ],
            { initialEntries: ['/datasets'] }
        );
        render(
            <Provider store={store}>
                <RouterProvider router={router} />
            </Provider>
        );
        await act(() => router.navigate('/dashboards'));
        if (lateHydration) {
            act(() => store.ui.hydrate());
        }
        await waitFor(() => expect(router.state.location.search).toBe('?id=dashboard-1'));
        expect(store.ui.dashboards.getState().workspaceDraftName).toBe(
            'Unsaved local name'
        );
        expect(JSON.parse(localStorage.getItem('dashboardsPage_v1')!)).toEqual(persisted);
        if (delayedList) {
            for (const status of [
                { list: 'error', detail: 'loading' },
                { list: 'loading', detail: 'loading' },
                { list: 'ready', detail: 'loading' },
                { list: 'ready', detail: 'error' },
                { list: 'ready', detail: 'loading' },
                { list: 'ready', detail: 'ready' },
            ] as const) {
                act(() => queries.setState(status));
                expect(store.ui.dashboards.getState()).toMatchObject({
                    workspaceDraftDashboardId: 'dashboard-1',
                    workspaceDraftName: 'Unsaved local name',
                });
                expect(JSON.parse(localStorage.getItem('dashboardsPage_v1')!)).toEqual(
                    persisted
                );
            }
        }
        await act(() => router.navigate('/datasets'));
        await act(() => router.navigate('/dashboards'));
        await waitFor(() => expect(router.state.location.search).toBe('?id=dashboard-1'));
        expect(store.ui.dashboards.getState().workspaceDraftName).toBe(
            'Unsaved local name'
        );
        expect(JSON.parse(localStorage.getItem('dashboardsPage_v1')!)).toEqual(persisted);
        await act(async () => {
            store.ui.dashboards.getState().selectDashboard(null);
            await router.navigate('/dashboards');
        });
        expect(router.state.location.search).toBe('');
        expect(store.ui.dashboards.getState().workspaceDraftName).toBe('');
        expect(JSON.parse(localStorage.getItem('dashboardsPage_v1')!)).toEqual({
            selectedDashboardId: null,
            workspaceDraftDashboardId: null,
            workspaceDraftName: '',
        });
    }
);
