import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { datasetsTestIds } from '../../../const';
import {
    datasetsPageSlice,
    selectFilterChartIds,
    selectFilterDashboardIds,
} from '../../../model';

import { DatasetsFilterPanel } from './DatasetsFilterPanel';

vi.mock('@/features/authenticate', () => ({
    useGetMeQuery: () => ({ data: { id: 'user-1' } }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: 'owner' },
    }),
}));

vi.mock('@/entities/chart', () => ({
    useListChartsQuery: () => ({
        data: [
            {
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
            },
        ],
    }),
}));

vi.mock('@/entities/dashboard', () => ({
    useListDashboardsQuery: () => ({
        data: [
            {
                id: 'dashboard-1',
                orgId: 'org-1',
                name: 'Sales',
                items: [],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
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

const makeStore = () =>
    configureStore({
        reducer: combineReducers({ [datasetsPageSlice.name]: datasetsPageSlice.reducer }),
    });

describe('DatasetsFilterPanel', () => {
    it('toggles chart and dashboard filters', async () => {
        const user = userEvent.setup();
        const store = makeStore();
        const { container } = render(
            <Provider store={store}>
                <DatasetsFilterPanel />
            </Provider>
        );

        await user.click(getByDataTestId(container, datasetsTestIds.filterChip));

        expect(selectFilterChartIds(store.getState())).toEqual(['chart-1']);

        await user.click(getByDataTestId(container, datasetsTestIds.filterTabDashboards));
        await user.click(getByDataTestId(container, datasetsTestIds.filterChip));

        expect(selectFilterDashboardIds(store.getState())).toEqual(['dashboard-1']);
    });
});
