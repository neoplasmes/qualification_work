import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Chart, ChartResponse } from '@/entities/chart';
import type { DatasetMetadata } from '@/entities/dataset';

import { chartsTestIds } from '../const';
import {
    chartsPageInitialState,
    chartsPageSlice,
    selectBuilderDatasetId,
    selectSelectedChartId,
    selectShowDatasetPicker,
    type ChartsPageState,
} from '../model';
import { ChartsWorkspace } from './ChartsWorkspace';

const mocks = vi.hoisted(() => ({
    getChartData: vi.fn(),
    deleteChart: vi.fn(),
    refetchCharts: vi.fn(),
}));

const chart = vi.hoisted(
    () =>
        ({
            id: 'chart-1',
            orgId: 'org-1',
            datasetId: 'dataset-1',
            name: 'Revenue',
            chartType: 'bar',
            config: {},
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        }) satisfies Chart
);

const chartResponse = vi.hoisted(
    () =>
        ({
            kind: 'bar',
            columns: [
                { name: 'month', role: 'dim', type: 'string' },
                { name: 'amount', role: 'measure', type: 'number' },
            ],
            rows: [['Jan', 120]],
            truncated: false,
            aggregatedAt: '2026-01-01T00:00:00.000Z',
        }) satisfies ChartResponse
);

const dataset = vi.hoisted(
    () =>
        ({
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
        }) satisfies DatasetMetadata
);

vi.mock('@/features/authenticate', () => ({
    useGetMeQuery: () => ({ data: { id: 'user-1' } }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: 'owner' },
    }),
}));

vi.mock('@/entities/chart', () => ({
    ChartResult: ({ data }: { data: ChartResponse }) => (
        <div data-testid="chart-result">{data.rows.length} rows</div>
    ),
    useListChartsQuery: () => ({
        data: [chart],
        isLoading: false,
        isFetching: false,
        refetch: mocks.refetchCharts,
    }),
    useLazyGetChartDataQuery: () => [mocks.getChartData, { isFetching: false }],
    useDeleteChartMutation: () => [mocks.deleteChart, { isLoading: false }],
}));

vi.mock('@/entities/dataset', () => ({
    useListDatasetsQuery: () => ({
        data: [dataset],
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
    }),
}));

vi.mock('@/features/buildChart', () => ({
    configToBuilderFields: () => ({}),
    DatasetChartBuilder: ({
        selectedDataset,
        onChartCreated,
    }: {
        selectedDataset: DatasetMetadata;
        onChartCreated?: (chartId: string) => void;
    }) => (
        <div data-testid="chart-builder">
            Builder for {selectedDataset.dataset.name}
            <button type="button" onClick={() => onChartCreated?.('chart-new')}>
                Save chart
            </button>
        </div>
    ),
}));

const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element = container.querySelector<T>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as T;
};

const renderWorkspace = (preloadedState: Partial<ChartsPageState>) => {
    const store = configureStore({
        reducer: combineReducers({ [chartsPageSlice.name]: chartsPageSlice.reducer }),
        preloadedState: {
            [chartsPageSlice.name]: {
                ...chartsPageInitialState,
                ...preloadedState,
            },
        },
    });

    return {
        store,
        ...render(
            <Provider store={store}>
                <ChartsWorkspace />
            </Provider>
        ),
    };
};

describe('ChartsWorkspace', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getChartData.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(chartResponse),
        });
        mocks.deleteChart.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
        mocks.refetchCharts.mockResolvedValue(undefined);
    });

    it('loads, refreshes and deletes the selected chart', async () => {
        const user = userEvent.setup();
        const { container, store } = renderWorkspace({ selectedChartId: 'chart-1' });

        await screen.findByTestId('chart-result');
        expect(mocks.getChartData).toHaveBeenCalledWith('chart-1', false);

        await user.click(getByDataTestId(container, chartsTestIds.refreshDataButton));

        await waitFor(() => expect(mocks.getChartData).toHaveBeenCalledTimes(2));

        await user.click(getByDataTestId(container, chartsTestIds.deleteButton));
        expect(screen.getByText('Confirm delete')).toBeInTheDocument();

        await user.click(getByDataTestId(container, chartsTestIds.deleteButton));

        await waitFor(() => expect(mocks.deleteChart).toHaveBeenCalledWith('chart-1'));
        expect(selectSelectedChartId(store.getState())).toBeNull();
    });

    it('selects a dataset from modal and finishes builder creation', async () => {
        const user = userEvent.setup();
        const { store } = renderWorkspace({ showDatasetPicker: true });

        await user.click(screen.getByRole('button', { name: /Invoices/ }));

        expect(selectBuilderDatasetId(store.getState())).toBe('dataset-1');
        expect(selectShowDatasetPicker(store.getState())).toBe(false);
        expect(screen.getByTestId('chart-builder')).toHaveTextContent('Invoices');

        await user.click(screen.getByRole('button', { name: 'Save chart' }));

        await waitFor(() => expect(mocks.refetchCharts).toHaveBeenCalledTimes(1));
        expect(selectBuilderDatasetId(store.getState())).toBeNull();
        expect(selectSelectedChartId(store.getState())).toBe('chart-new');
    });
});
