import type * as readModule from '@/env/cache/useRead';
import { deferred } from '@/test/readFixtures';
import { createUiTestRuntime, UiTestProvider as Provider } from '@/test/uiRuntime';
import { useDependencies } from '@/ui/di/dependencies';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardsLeftPanel } from './DashboardsLeftPanel';

const createDashboard = vi.fn();

vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: { id: 'user-1' }, isLoading: false }),
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
                return {
                    data: [
                        {
                            id: 'dashboard-1',
                            orgId: 'org-1',
                            name: 'Revenue',
                            items: [],
                            createdAt: '2026-01-01',
                            updatedAt: '2026-01-01',
                        },
                    ],
                    isPending: false,
                };
            }
            if (query.name === 'getDashboard') {
                return { data: undefined, isPending: false };
            }
            if (query.name === 'listCharts') {
                return {
                    data: [],
                    isLoading: false,
                    isFetching: false,
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

const makeStore = () => createUiTestRuntime();

const renderPanel = () =>
    render(
        <Provider store={makeStore()}>
            <MemoryRouter initialEntries={['/dashboards']}>
                <DashboardsLeftPanel />
            </MemoryRouter>
        </Provider>
    );

describe('DashboardsLeftPanel', () => {
    beforeEach(() => {
        createDashboard.mockReset();
    });

    it('shows existing dashboards and creates a new one with default name', async () => {
        const user = userEvent.setup();
        createDashboard.mockReturnValue({
            unwrap: () => Promise.resolve({ id: 'dashboard-2' }),
        });

        renderPanel();

        expect(screen.getByRole('button', { name: /Revenue/ })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Новый дашборд/i }));
        await waitFor(() =>
            expect(createDashboard).toHaveBeenCalledWith({
                orgId: 'org-1',
                name: 'Новый дашборд',
            })
        );
    });
});

vi.mock('@/env/cache/useCommand', () => ({
    useCommand: (command: unknown) => {
        const dependencies = useDependencies();
        if (command === dependencies.createDashboard) {
            return {
                executeOutcome: async (input: unknown) => {
                    const outcome = createDashboard(input);

                    return { data: await outcome.unwrap(), syncError: outcome.syncError };
                },
                isPending: false,
            };
        }

        throw new Error('Unexpected command');
    },
}));

it.each(['confirmed', 'rejected'])(
    'does not navigate after leaving a pending create view: %s',
    async result => {
        createDashboard.mockReset();
        const gate = deferred<{ id: string }>();
        createDashboard.mockReturnValue({ unwrap: () => gate.promise });
        const store = makeStore();
        const router = createMemoryRouter(
            [
                { path: '/dashboards', element: <DashboardsLeftPanel /> },
                { path: '/datasets', element: <p>Dataset view</p> },
            ],
            { initialEntries: ['/dashboards'] }
        );
        render(
            <Provider store={store}>
                <RouterProvider router={router} />
            </Provider>
        );
        await userEvent.click(screen.getByRole('button', { name: 'Новый дашборд' }));
        await act(async () => {
            await router.navigate('/datasets');
        });
        await act(async () => {
            if (result === 'confirmed') {
                gate.resolve({ id: 'new-board' });
            } else {
                gate.reject(new Error('write failed'));
            }
            await gate.promise.catch(() => {});
        });
        expect(router.state.location.pathname).toBe('/datasets');
        expect(store.ui.dashboards.getState().rememberedDashboardId).toBeNull();
        expect(createDashboard).toHaveBeenCalledOnce();
    }
);

it('keeps a confirmed creation receipt after selecting the new dashboard', async () => {
    createDashboard.mockReset().mockReturnValue({
        unwrap: async () => ({ id: 'created' }),
        syncError: new Error('refresh failed'),
    });
    const store = makeStore();
    const router = createMemoryRouter([{ path: '*', element: <DashboardsLeftPanel /> }], {
        initialEntries: ['/dashboards'],
    });
    render(
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Новый дашборд' }));
    expect(
        await screen.findByText(/Дашборд создан, но обновление данных не удалось/)
    ).toBeVisible();
    expect(router.state.location.search).toBe('?id=created');
    expect(screen.getByRole('button', { name: 'Обновить список' })).toBeVisible();
    expect(createDashboard).toHaveBeenCalledOnce();
});
