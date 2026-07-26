import type * as readModule from '@/env/cache/useRead';
import { createUiTestRuntime, UiTestProvider as Provider } from '@/test/uiRuntime';
import { useDependencies } from '@/ui/di/dependencies';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
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
                executeOutcome: async (input: unknown) => ({
                    data: await createDashboard(input).unwrap(),
                }),
                isPending: false,
            };
        }

        throw new Error('Unexpected command');
    },
}));
