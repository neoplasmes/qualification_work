import type { Dashboard } from '@/core/entities/dashboard';
import type * as readModule from '@/env/cache/useRead';
import { deferred } from '@/test/readFixtures';
import { createUiTestRuntime, UiTestProvider as Provider } from '@/test/uiRuntime';
import { useDependencies } from '@/ui/di/dependencies';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dashboardsTestIds } from '../../const';
import { dashboardsPageInitialState } from '../../model';
import { DashboardsPropertiesPanel } from './DashboardsPropertiesPanel';

const mocks = vi.hoisted(() => ({
    renameDashboard: vi.fn(),
    deleteDashboard: vi.fn(),
    getDashboardQuery: vi.fn(),
    refetchDashboard: vi.fn(),
    refetchDashboards: vi.fn(),
}));

const dashboard = vi.hoisted(
    () =>
        ({
            ref: 'dashboard:org-1/dashboard-1',
            id: 'dashboard-1',
            orgId: 'org-1',
            name: 'Sales',
            items: [
                {
                    ref: 'dashboardItem:org-1/dashboard-1/item-chart',
                    id: 'item-chart',
                    kind: 'chart',
                    chartId: 'chart-1',
                    layout: { posX: 0, posY: 0, width: 12, height: 8 },
                },
                {
                    ref: 'dashboardItem:org-1/dashboard-1/item-metric',
                    id: 'item-metric',
                    kind: 'metric',
                    datasetId: 'dataset-1',
                    name: 'Revenue',
                    expression: 'sum(total)',
                    format: '₽',
                    valueMultiplier: 1,
                    target: null,
                    targetDirection: null,
                    showTrend: false,
                    timeColumn: null,
                    timeBucket: null,
                    value: 1200,
                    layout: { posX: 0, posY: 8, width: 12, height: 4 },
                },
            ],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
        }) satisfies Dashboard
);

vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: { id: 'user-1' } }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: 'owner' },
    }),
}));

const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element = container.querySelector<T>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as T;
};

const renderPropertiesPanel = (rememberedDashboardId: string | null) => {
    const store = createUiTestRuntime({
        dashboards: {
            ...dashboardsPageInitialState,
            rememberedDashboardId,
        },
    });

    return {
        store,
        ...render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/dashboards?id=dashboard-1']}>
                    <DashboardsPropertiesPanel />
                </MemoryRouter>
            </Provider>
        ),
    };
};

describe('DashboardsPropertiesPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.renameDashboard.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
        mocks.deleteDashboard.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
        mocks.refetchDashboard.mockResolvedValue(undefined);
        mocks.refetchDashboards.mockResolvedValue(undefined);
    });

    it('loads properties for the visible fallback dashboard when persisted selection is stale', () => {
        renderPropertiesPanel('stale-dashboard');

        expect(mocks.getDashboardQuery).toHaveBeenCalledWith('dashboard-1');
        expect(screen.getByRole('heading', { name: 'Sales' })).toBeInTheDocument();
        expect(screen.getByText('Widgets')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('renames dashboard from properties title', async () => {
        const user = userEvent.setup();
        const { container } = renderPropertiesPanel('dashboard-1');

        await user.click(getByDataTestId(container, dashboardsTestIds.renameButton));

        const input = getByDataTestId<HTMLInputElement>(
            container,
            dashboardsTestIds.renameInput
        );
        await user.clear(input);
        await user.type(input, 'Operations');
        await user.keyboard('{Enter}');

        await waitFor(() => expect(mocks.renameDashboard).toHaveBeenCalledTimes(1));
        expect(mocks.renameDashboard).toHaveBeenCalledWith({
            orgId: 'org-1',
            dashboardId: 'dashboard-1',
            name: 'Operations',
        });
    });

    it('clears explicit selection after confirmed delete', async () => {
        const user = userEvent.setup();
        const { store } = renderPropertiesPanel('dashboard-1');

        await user.click(screen.getByRole('button', { name: 'Удалить дашборд' }));
        await user.click(screen.getByRole('button', { name: 'Подтвердить удаление' }));

        await waitFor(() => expect(mocks.deleteDashboard).toHaveBeenCalledTimes(1));
        expect(mocks.deleteDashboard).toHaveBeenCalledWith({
            orgId: 'org-1',
            dashboardId: 'dashboard-1',
        });
        expect(store.ui.dashboards.getState().rememberedDashboardId).toBeNull();
    });
});

vi.mock('@/env/cache/useRead', async importOriginal => {
    const actual = await importOriginal<typeof readModule>();

    return {
        ...actual,
        useRead: (query: { name: string }, input: unknown, options: unknown) => {
            if (query.name === 'listDashboards') {
                return { data: [dashboard], isPending: false };
            }
            if (query.name === 'getDashboard') {
                const id = (input as { dashboardId: string }).dashboardId;
                mocks.getDashboardQuery(id);

                return {
                    data: id === dashboard.id ? dashboard : undefined,
                    isPending: false,
                };
            }

            return actual.useRead(query as never, input, options as never);
        },
    };
});

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
                executeOutcome: async (input: unknown) => {
                    const outcome = mocks.deleteDashboard(input);

                    return { data: await outcome.unwrap(), syncError: outcome.syncError };
                },
                isPending: false,
            };
        }

        throw new Error('Unexpected command');
    },
}));

it.each(['confirmed', 'rejected'])(
    'keeps a newer selection when an earlier delete completes: %s',
    async result => {
        mocks.deleteDashboard.mockReset();
        const gate = deferred<void>();
        mocks.deleteDashboard.mockReturnValue({ unwrap: () => gate.promise });
        const store = createUiTestRuntime();
        const router = createMemoryRouter(
            [{ path: '*', element: <DashboardsPropertiesPanel /> }],
            { initialEntries: ['/dashboards?id=dashboard-1'] }
        );
        render(
            <Provider store={store}>
                <RouterProvider router={router} />
            </Provider>
        );
        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Удалить дашборд' }));
        await user.click(screen.getByRole('button', { name: 'Подтвердить удаление' }));
        await act(async () => {
            store.ui.dashboards.getState().selectDashboard('dashboard-2');
            await router.navigate('/dashboards?id=dashboard-2');
        });
        await act(async () => {
            if (result === 'confirmed') {
                gate.resolve();
            } else {
                gate.reject(new Error('write failed'));
            }
            await gate.promise.catch(() => {});
        });
        expect(router.state.location.search).toBe('?id=dashboard-2');
        expect(store.ui.dashboards.getState().rememberedDashboardId).toBe('dashboard-2');
        expect(mocks.deleteDashboard).toHaveBeenCalledOnce();
    }
);

it('keeps a confirmed deletion receipt on the dashboard index', async () => {
    mocks.deleteDashboard.mockReset().mockReturnValue({
        unwrap: async () => undefined,
        syncError: new Error('refresh failed'),
    });
    const store = createUiTestRuntime();
    const router = createMemoryRouter(
        [{ path: '*', element: <DashboardsPropertiesPanel /> }],
        { initialEntries: ['/dashboards?id=dashboard-1'] }
    );
    render(
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Удалить дашборд' }));
    await user.click(screen.getByRole('button', { name: 'Подтвердить удаление' }));
    expect(
        await screen.findByText(/Дашборд удалён, но обновление списка не удалось/)
    ).toBeVisible();
    expect(router.state.location.search).toBe('');
    expect(screen.getByRole('button', { name: 'Обновить данные' })).toBeVisible();
    expect(mocks.deleteDashboard).toHaveBeenCalledOnce();
});
