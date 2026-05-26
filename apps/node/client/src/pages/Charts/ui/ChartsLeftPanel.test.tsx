import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { chartsTestIds } from '../const';
import {
    chartsPageSlice,
    selectSelectedChartId,
    selectShowDatasetPicker,
    toggleDatasetFilter,
} from '../model';
import { ChartsLeftPanel } from './ChartsLeftPanel';

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
                config: {},
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
                id: 'chart-2',
                orgId: 'org-1',
                datasetId: 'dataset-2',
                name: 'Status',
                chartType: 'pie',
                config: {},
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
    }),
}));

vi.mock('@/entities/dashboard', () => ({
    useListDashboardsQuery: () => ({
        data: [],
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
    }),
}));

vi.mock('@/entities/dataset', () => ({
    useListDatasetsQuery: () => ({
        data: [
            {
                dataset: {
                    id: 'dataset-1',
                    name: 'Invoices',
                    orgId: 'org-1',
                    sourceType: 'manual',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                },
                columns: [],
                totalRows: 1,
            },
            {
                dataset: {
                    id: 'dataset-2',
                    name: 'Statuses',
                    orgId: 'org-1',
                    sourceType: 'manual',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                },
                columns: [],
                totalRows: 1,
            },
        ],
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
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

const makeStore = (withFilter = false) => {
    const store = configureStore({
        reducer: combineReducers({ [chartsPageSlice.name]: chartsPageSlice.reducer }),
    });

    if (withFilter) {
        store.dispatch(toggleDatasetFilter('dataset-1'));
    }

    return store;
};

describe('ChartsLeftPanel', () => {
    it('selects a chart and opens dataset picker', async () => {
        const user = userEvent.setup();
        const store = makeStore();
        const { container } = render(
            <Provider store={store}>
                <ChartsLeftPanel />
            </Provider>
        );

        await user.click(screen.getByRole('button', { name: /Revenue/ }));
        await user.click(getByDataTestId(container, chartsTestIds.createChartButton));

        expect(selectSelectedChartId(store.getState())).toBe('chart-1');
        expect(selectShowDatasetPicker(store.getState())).toBe(true);
    });

    it('renders charts filtered by selected dataset ids', () => {
        render(
            <Provider store={makeStore(true)}>
                <ChartsLeftPanel />
            </Provider>
        );

        expect(screen.getByRole('button', { name: /Revenue/ })).toBeInTheDocument();
        expect(screen.getByText('Invoices')).toBeInTheDocument();
        expect(screen.queryByText('dataset-1')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Status/ })).not.toBeInTheDocument();
    });
});
