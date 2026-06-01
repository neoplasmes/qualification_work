import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Dashboard } from '@/entities/dashboard';

import { dashboardsTestIds } from '../../../const';
import { dashboardsPageInitialState, dashboardsPageSlice } from '../../../model';

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
            id: 'dashboard-1',
            orgId: 'org-1',
            name: 'Sales',
            items: [
                {
                    id: 'item-chart',
                    kind: 'chart',
                    chartId: 'chart-1',
                    layout: { posX: 0, posY: 0, width: 12, height: 8 },
                },
                {
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

vi.mock('@/features/authenticate', () => ({
    useGetMeQuery: () => ({ data: { id: 'user-1' } }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: 'owner' },
    }),
}));

vi.mock('@/entities/dashboard', () => ({
    useListDashboardsQuery: () => ({
        data: [{ ...dashboard, items: undefined }],
        refetch: mocks.refetchDashboards,
    }),
    useGetDashboardQuery: (dashboardId: string) => {
        mocks.getDashboardQuery(dashboardId);

        return {
            data: dashboardId === dashboard.id ? dashboard : undefined,
            isLoading: false,
            isFetching: false,
            refetch: mocks.refetchDashboard,
        };
    },
    useDeleteDashboardMutation: () => [mocks.deleteDashboard, { isLoading: false }],
}));

vi.mock('@/features/manageDashboards', () => ({
    useRenameDashboardMutation: () => [mocks.renameDashboard, { isLoading: false }],
}));

const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element = container.querySelector<T>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as T;
};

const renderPropertiesPanel = (selectedDashboardId: string | null) => {
    const store = configureStore({
        reducer: combineReducers({
            [dashboardsPageSlice.name]: dashboardsPageSlice.reducer,
        }),
        preloadedState: {
            [dashboardsPageSlice.name]: {
                ...dashboardsPageInitialState,
                selectedDashboardId,
            },
        },
    });

    return {
        store,
        ...render(
            <Provider store={store}>
                <DashboardsPropertiesPanel />
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
            dashboardId: 'dashboard-1',
            name: 'Operations',
        });
    });

    it('clears explicit selection after confirmed delete', async () => {
        const user = userEvent.setup();
        const { store } = renderPropertiesPanel('dashboard-1');

        await user.click(screen.getByRole('button', { name: 'Delete dashboard' }));
        await user.click(screen.getByRole('button', { name: 'Confirm delete' }));

        await waitFor(() => expect(mocks.deleteDashboard).toHaveBeenCalledTimes(1));
        expect(mocks.deleteDashboard).toHaveBeenCalledWith('dashboard-1');
        expect(store.getState().dashboardsPage.selectedDashboardId).toBeNull();
    });
});
