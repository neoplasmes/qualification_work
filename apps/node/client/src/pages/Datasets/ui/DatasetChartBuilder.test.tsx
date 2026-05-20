import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DatasetChartBuilder } from './DatasetChartBuilder';

const createChart = vi.fn();
const getChartData = vi.fn();

vi.mock('@/features/charts', () => ({
    useCreateChartMutation: () => [
        createChart,
        {
            isLoading: false,
        },
    ],
    useLazyGetChartDataQuery: () => [
        getChartData,
        {
            isFetching: false,
            data: null,
        },
    ],
}));

const dataset = {
    dataset: {
        id: 'dataset-1',
        orgId: 'org-1',
        name: 'sales',
        sourceType: 'csv' as const,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
    columns: [
        {
            id: 'city',
            datasetId: 'dataset-1',
            key: 'city',
            displayName: 'city',
            dataType: 'string' as const,
            orderIndex: 0,
        },
        {
            id: 'country',
            datasetId: 'dataset-1',
            key: 'country',
            displayName: 'country',
            dataType: 'string' as const,
            orderIndex: 1,
        },
        {
            id: 'score',
            datasetId: 'dataset-1',
            key: 'score',
            displayName: 'score',
            dataType: 'number' as const,
            orderIndex: 2,
        },
    ],
    totalRows: 10,
};

describe('DatasetChartBuilder', () => {
    beforeEach(() => {
        createChart.mockReset();
        getChartData.mockReset();
        createChart.mockReturnValue({
            unwrap: () => Promise.resolve({ id: 'chart-1' }),
        });
        getChartData.mockReturnValue({
            unwrap: () =>
                Promise.resolve({
                    kind: 'heatmap',
                    columns: [],
                    rows: [],
                    truncated: false,
                    aggregatedAt: '2026-01-01T00:00:00.000Z',
                }),
        });
    });

    it('builds a heatmap config with measure and typed filter values', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <DatasetChartBuilder orgId="org-1" selectedDataset={dataset} />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText('Name'), 'Score heatmap');
        await user.selectOptions(screen.getByLabelText('Type'), 'heatmap');
        await user.selectOptions(screen.getByLabelText('X dimension'), 'city');
        await user.selectOptions(screen.getByLabelText('Y dimension'), 'country');
        await user.selectOptions(screen.getByLabelText('Aggregate'), 'avg');
        await user.selectOptions(screen.getByLabelText('Measure'), 'score');
        await user.selectOptions(screen.getByLabelText('Filter'), 'on');
        await user.selectOptions(screen.getByLabelText('Filter column'), 'score');
        await user.selectOptions(screen.getByLabelText('Operation'), 'between');
        await user.type(screen.getByLabelText('Value'), '10, 50');
        await user.click(screen.getByRole('button', { name: /build chart/i }));

        await waitFor(() => expect(createChart).toHaveBeenCalledTimes(1));
        expect(createChart).toHaveBeenCalledWith({
            orgId: 'org-1',
            datasetId: 'dataset-1',
            name: 'Score heatmap',
            chartType: 'heatmap',
            config: expect.objectContaining({
                kind: 'heatmap',
                x: { columnId: 'city' },
                y: { columnId: 'country' },
                measure: { aggregate: 'avg', columnId: 'score' },
                filters: [{ columnId: 'score', op: 'between', value: [10, 50] }],
            }),
        });
        expect(getChartData).toHaveBeenCalledWith('chart-1', false);
    });
});
