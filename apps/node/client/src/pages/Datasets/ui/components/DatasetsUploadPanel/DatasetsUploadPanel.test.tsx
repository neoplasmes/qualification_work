import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { datasetsTestIds } from '../../../const';
import {
    datasetsPageSlice,
    selectSelectedDatasetId,
    selectShowUpload,
    toggleChartFilter,
} from '../../../model';

import { DatasetsUploadPanel } from './DatasetsUploadPanel';

vi.mock('@/features/authenticate', () => ({
    useGetMeQuery: () => ({ data: { id: 'user-1' } }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: 'owner' },
    }),
}));

vi.mock('@/entities/dataset', () => ({
    useListDatasetsQuery: () => ({
        data: [
            {
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
            },
            {
                dataset: {
                    id: 'dataset-2',
                    orgId: 'org-1',
                    name: 'Payments',
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
        ],
    }),
}));

vi.mock('@/entities/dashboard', () => ({
    useListDashboardsQuery: () => ({ data: [] }),
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
        reducer: combineReducers({ [datasetsPageSlice.name]: datasetsPageSlice.reducer }),
    });

    if (withFilter) {
        store.dispatch(toggleChartFilter('chart-1'));
    }

    return store;
};

describe('DatasetsUploadPanel', () => {
    it('selects a dataset and opens upload modal state', async () => {
        const user = userEvent.setup();
        const store = makeStore();
        const { container } = render(
            <Provider store={store}>
                <DatasetsUploadPanel />
            </Provider>
        );

        await user.click(screen.getByRole('button', { name: /Invoices/ }));
        await user.click(getByDataTestId(container, datasetsTestIds.uploadButton));

        expect(selectSelectedDatasetId(store.getState())).toBe('dataset-1');
        expect(selectShowUpload(store.getState())).toBe(true);
    });

    it('renders datasets filtered by chart relationships', () => {
        render(
            <Provider store={makeStore(true)}>
                <DatasetsUploadPanel />
            </Provider>
        );

        expect(screen.getByRole('button', { name: /Invoices/ })).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /Payments/ })
        ).not.toBeInTheDocument();
    });
});
