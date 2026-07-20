import { createUiTestRuntime, UiTestProvider as Provider } from '@/test/uiRuntime';
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

vi.mock('@/entities/chart', () => ({
    formatChartCell: (value: unknown) => String(value),
    useListChartsQuery: () => ({ data: [], isLoading: false, isFetching: false }),
}));

vi.mock('@/entities/dashboard', () => ({
    useListDashboardsQuery: () => ({
        data: [
            {
                id: 'dashboard-1',
                orgId: 'org-1',
                name: 'Revenue',
                items: [],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
    }),
}));

vi.mock('@/features/manageDashboards', () => ({
    useCreateDashboardMutation: () => [createDashboard, { isLoading: false }],
}));

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

        await user.click(screen.getByRole('button', { name: /new dashboard/i }));
        await waitFor(() =>
            expect(createDashboard).toHaveBeenCalledWith({
                orgId: 'org-1',
                name: 'New dashboard',
            })
        );
    });
});
