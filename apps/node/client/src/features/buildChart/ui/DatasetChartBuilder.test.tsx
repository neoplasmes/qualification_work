import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DatasetChartBuilder } from './DatasetChartBuilder';

const previewChart = vi.fn();
const createChart = vi.fn();
const updateChart = vi.fn();

const previewResponse = {
    kind: 'heatmap' as const,
    columns: [],
    rows: [],
    truncated: false,
    aggregatedAt: '2026-01-01T00:00:00.000Z',
};

vi.mock('../api', () => ({
    usePreviewChartDataMutation: () => [previewChart, { isLoading: false }],
    useCreateChartMutation: () => [createChart, { isLoading: false }],
    useUpdateChartMutation: () => [updateChart, { isLoading: false }],
}));

vi.mock('@/entities/chart', () => ({
    ChartResult: () => <div data-testid="chart-result" />,
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
        previewChart.mockReset();
        createChart.mockReset();
        updateChart.mockReset();
        previewChart.mockReturnValue({ unwrap: () => Promise.resolve(previewResponse) });
        createChart.mockReturnValue({ unwrap: () => Promise.resolve({ id: 'chart-1' }) });
        updateChart.mockReturnValue({ unwrap: () => Promise.resolve(undefined) });
    });

    it('previews chart without saving, then saves on confirm', async () => {
        const user = userEvent.setup();
        const onChartCreated = vi.fn();

        render(
            <MemoryRouter>
                <DatasetChartBuilder
                    orgId="org-1"
                    selectedDataset={dataset}
                    onChartCreated={onChartCreated}
                />
            </MemoryRouter>
        );

        await user.selectOptions(screen.getByLabelText('Chart type'), 'heatmap');
        await user.selectOptions(screen.getByLabelText('X axis'), 'city');
        await user.selectOptions(screen.getByLabelText('Y axis'), 'country');
        await user.selectOptions(screen.getByLabelText('Aggregation'), 'avg');
        await user.selectOptions(screen.getByLabelText('Column'), 'score');
        await user.click(screen.getByRole('button', { name: 'Preview' }));

        await waitFor(() => expect(previewChart).toHaveBeenCalledTimes(1));
        expect(previewChart).toHaveBeenCalledWith(
            expect.objectContaining({
                datasetId: 'dataset-1',
                chartType: 'heatmap',
                config: expect.objectContaining({ kind: 'heatmap' }),
            })
        );

        // createChart must not be called yet
        expect(createChart).not.toHaveBeenCalled();

        // preview step is shown
        expect(screen.getByTestId('chart-result')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save chart/i })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /save chart/i }));

        await waitFor(() => expect(createChart).toHaveBeenCalledTimes(1));
        expect(createChart).toHaveBeenCalledWith(
            expect.objectContaining({
                orgId: 'org-1',
                datasetId: 'dataset-1',
                chartType: 'heatmap',
            })
        );
        expect(onChartCreated).toHaveBeenCalledWith('chart-1');
    });

    it('goes back to config form when Edit is clicked', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <DatasetChartBuilder orgId="org-1" selectedDataset={dataset} />
            </MemoryRouter>
        );

        await user.click(screen.getByRole('button', { name: 'Preview' }));
        await waitFor(() =>
            expect(screen.getByTestId('chart-result')).toBeInTheDocument()
        );

        await user.click(screen.getByRole('button', { name: /edit/i }));

        expect(screen.queryByTestId('chart-result')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    });

    it('builds correct heatmap config with between filter', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <DatasetChartBuilder orgId="org-1" selectedDataset={dataset} />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText('Chart name'), 'Score heatmap');
        await user.selectOptions(screen.getByLabelText('Chart type'), 'heatmap');
        await user.selectOptions(screen.getByLabelText('X axis'), 'city');
        await user.selectOptions(screen.getByLabelText('Y axis'), 'country');
        await user.selectOptions(screen.getByLabelText('Aggregation'), 'avg');
        await user.selectOptions(screen.getByLabelText('Column'), 'score');
        await user.selectOptions(screen.getByLabelText('Value format'), 'rub');
        await user.selectOptions(screen.getByLabelText('Filter rows'), 'on');
        await user.selectOptions(screen.getByLabelText('Filter column'), 'score');
        await user.selectOptions(screen.getByLabelText('Condition'), 'between');
        await user.type(screen.getByLabelText('Value'), '10, 50');
        await user.click(screen.getByRole('button', { name: 'Preview' }));

        await waitFor(() => expect(previewChart).toHaveBeenCalledTimes(1));
        expect(previewChart).toHaveBeenCalledWith({
            datasetId: 'dataset-1',
            chartType: 'heatmap',
            config: expect.objectContaining({
                kind: 'heatmap',
                x: { columnId: 'city' },
                y: { columnId: 'country' },
                measure: { aggregate: 'avg', columnId: 'score', valueFormat: 'rub' },
                filters: [{ columnId: 'score', op: 'between', value: [10, 50] }],
            }),
        });
    });

    it('saves edited chart without requesting preview', async () => {
        const user = userEvent.setup();
        const onChartUpdated = vi.fn();

        render(
            <MemoryRouter>
                <DatasetChartBuilder
                    orgId="org-1"
                    selectedDataset={dataset}
                    editChartId="chart-1"
                    onChartUpdated={onChartUpdated}
                />
            </MemoryRouter>
        );

        await user.selectOptions(screen.getByLabelText('Aggregation'), 'avg');
        await user.selectOptions(screen.getByLabelText('Column'), 'score');
        await user.click(screen.getByRole('button', { name: /save without preview/i }));

        await waitFor(() => expect(updateChart).toHaveBeenCalledTimes(1));
        expect(previewChart).not.toHaveBeenCalled();
        expect(updateChart).toHaveBeenCalledWith(
            expect.objectContaining({
                chartId: 'chart-1',
                config: expect.objectContaining({
                    measure: {
                        aggregate: 'avg',
                        columnId: 'score',
                        valueFormat: 'number',
                    },
                }),
            })
        );
        expect(onChartUpdated).toHaveBeenCalledWith('chart-1');
    });
});
