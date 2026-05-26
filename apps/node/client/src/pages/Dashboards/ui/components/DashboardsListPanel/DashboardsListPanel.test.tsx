import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dashboardsPageSlice } from '../../../model/dashboardsPageSlice';

import { DashboardsListPanel } from './DashboardsListPanel';

const createDashboard = vi.fn();

vi.mock('@/features/authenticate', () => ({
    useGetMeQuery: () => ({ data: { id: 'user-1' }, isLoading: false }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: 'owner' },
    }),
}));

vi.mock('@/entities/chart', () => ({
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

const makeStore = () =>
    configureStore({
        reducer: combineReducers({
            [dashboardsPageSlice.name]: dashboardsPageSlice.reducer,
        }),
    });

const renderPanel = () =>
    render(
        <Provider store={makeStore()}>
            <DashboardsListPanel />
        </Provider>
    );

describe('DashboardsListPanel', () => {
    beforeEach(() => {
        createDashboard.mockReset();
    });

    it('validates empty dashboard names before calling create', async () => {
        const user = userEvent.setup();
        renderPanel();

        await user.click(screen.getByRole('button', { name: /create/i }));

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Dashboard name can not be empty.'
        );
        expect(createDashboard).not.toHaveBeenCalled();
    });

    it('shows existing dashboards and creates a new one', async () => {
        const user = userEvent.setup();
        createDashboard.mockReturnValue({
            unwrap: () => Promise.resolve({ id: 'dashboard-2' }),
        });

        renderPanel();

        expect(screen.getByRole('button', { name: /Revenue/ })).toBeInTheDocument();

        await user.type(screen.getByLabelText('New dashboard'), 'Operations');
        await user.click(screen.getByRole('button', { name: /create/i }));
        await waitFor(() =>
            expect(createDashboard).toHaveBeenCalledWith({
                orgId: 'org-1',
                name: 'Operations',
            })
        );
    });
});
