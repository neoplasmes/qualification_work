import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as ChartEntity from '@/entities/chart';

import { createChartBuilderFields } from '../lib';
import { createTestDataset, renderDatasetChartBuilder, setColumnAnalyzable } from './lib';

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

vi.mock('@/entities/chart', async importOriginal => {
    const actual = await importOriginal<typeof ChartEntity>();

    return {
        ...actual,
        ChartShell: () => <div data-testid="chart-result" />,
        ChartConfigSummary: () => <p data-testid="chart-summary" />,
    };
});

let testDataset = createTestDataset(0);
let datasetSequence = 0;

describe('DatasetChartBuilder', () => {
    beforeEach(() => {
        datasetSequence += 1;
        testDataset = createTestDataset(datasetSequence);
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

        renderDatasetChartBuilder({
            selectedDataset: testDataset,
            onChartCreated,
        });

        await user.selectOptions(screen.getByLabelText('Chart type'), 'heatmap');
        await user.selectOptions(screen.getByLabelText('X axis'), 'city');
        await user.selectOptions(screen.getByLabelText('Y axis'), 'country');
        await user.selectOptions(screen.getByLabelText('Aggregation'), 'avg');
        await user.selectOptions(screen.getByLabelText('Column'), 'score');
        await user.click(screen.getByRole('button', { name: 'Preview' }));

        await waitFor(() => expect(previewChart).toHaveBeenCalledTimes(1));
        expect(previewChart).toHaveBeenCalledWith(
            expect.objectContaining({
                datasetId: testDataset.dataset.id,
                chartType: 'heatmap',
                config: expect.objectContaining({ kind: 'heatmap', limit: 200 }),
            })
        );
        expect(createChart).not.toHaveBeenCalled();
        expect(screen.getByTestId('chart-result')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save chart/i })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /save chart/i }));

        await waitFor(() => expect(createChart).toHaveBeenCalledTimes(1));
        expect(createChart).toHaveBeenCalledWith(
            expect.objectContaining({
                orgId: 'org-1',
                datasetId: testDataset.dataset.id,
                chartType: 'heatmap',
            })
        );
        expect(onChartCreated).toHaveBeenCalledWith('chart-1');
    });

    it('goes back to config form when Edit is clicked', async () => {
        const user = userEvent.setup();

        renderDatasetChartBuilder({ selectedDataset: testDataset });

        await user.click(screen.getByRole('button', { name: 'Preview' }));
        await waitFor(() =>
            expect(screen.getByTestId('chart-result')).toBeInTheDocument()
        );

        await user.click(screen.getByRole('button', { name: /edit/i }));

        expect(screen.queryByTestId('chart-result')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    });

    it('disables grouping select when only none is available', async () => {
        const user = userEvent.setup();

        renderDatasetChartBuilder({ selectedDataset: testDataset });

        const groupBySelect = screen.getByLabelText('Group X by');

        expect(groupBySelect).toBeDisabled();

        await user.selectOptions(screen.getByLabelText('X axis'), 'score');

        expect(groupBySelect).toBeEnabled();
    });

    it('does not expose row limit setting', () => {
        renderDatasetChartBuilder({ selectedDataset: testDataset });

        expect(screen.queryByLabelText('Row limit')).not.toBeInTheDocument();
    });

    it('does not expose sort setting for bar or line charts', async () => {
        const user = userEvent.setup();

        renderDatasetChartBuilder({ selectedDataset: testDataset });

        expect(screen.queryByLabelText('Sort')).not.toBeInTheDocument();

        await user.selectOptions(screen.getByLabelText('Chart type'), 'line');

        expect(screen.queryByLabelText('Sort')).not.toBeInTheDocument();
    });

    it('orders bar charts by dimension instead of measure', async () => {
        const user = userEvent.setup();

        renderDatasetChartBuilder({ selectedDataset: testDataset });

        await user.click(screen.getByRole('button', { name: 'Preview' }));

        await waitFor(() => expect(previewChart).toHaveBeenCalledTimes(1));
        expect(previewChart).toHaveBeenCalledWith(
            expect.objectContaining({
                chartType: 'bar',
                config: expect.objectContaining({
                    kind: 'bar',
                    orderBy: { ref: 'dim', index: 0, dir: 'asc' },
                }),
            })
        );
    });

    it('orders line charts by dimension instead of measure', async () => {
        const user = userEvent.setup();

        renderDatasetChartBuilder({ selectedDataset: testDataset });

        await user.selectOptions(screen.getByLabelText('Chart type'), 'line');
        await user.click(screen.getByRole('button', { name: 'Preview' }));

        await waitFor(() => expect(previewChart).toHaveBeenCalledTimes(1));
        expect(previewChart).toHaveBeenCalledWith(
            expect.objectContaining({
                chartType: 'line',
                config: expect.objectContaining({
                    kind: 'line',
                    orderBy: { ref: 'dim', index: 0, dir: 'asc' },
                }),
            })
        );
    });

    it('renders non-analyzable columns disabled and defaults to analyzable columns', () => {
        const disabledDataset = setColumnAnalyzable(testDataset, 'city', false);

        renderDatasetChartBuilder({ selectedDataset: disabledDataset });

        const axisSelect = screen.getByLabelText('X axis') as HTMLSelectElement;
        const cityOption = within(axisSelect).getByRole('option', {
            name: 'city',
        }) as HTMLOptionElement;

        expect(cityOption).toBeDisabled();
        expect(axisSelect.value).toBe('country');
    });

    it('blocks saving edited charts while a selected column is not analyzable', () => {
        const disabledDataset = setColumnAnalyzable(testDataset, 'city', false);

        renderDatasetChartBuilder({
            selectedDataset: disabledDataset,
            editChartId: 'chart-1',
            initialFields: { dimensionColumnId: 'city' },
        });

        expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
    });

    it('builds correct heatmap config with between filter', async () => {
        const user = userEvent.setup();

        renderDatasetChartBuilder({ selectedDataset: testDataset });

        await user.type(screen.getByLabelText('Chart name'), 'Score heatmap');
        await user.selectOptions(screen.getByLabelText('Chart type'), 'heatmap');
        await user.selectOptions(screen.getByLabelText('X axis'), 'city');
        await user.selectOptions(screen.getByLabelText('Y axis'), 'country');
        await user.selectOptions(screen.getByLabelText('Aggregation'), 'avg');
        await user.selectOptions(screen.getByLabelText('Column'), 'score');
        await user.type(screen.getByLabelText('Value format'), 'kg');
        await user.click(screen.getByRole('switch', { name: 'Filter rows' }));
        await user.selectOptions(screen.getByLabelText('Filter column'), 'score');
        await user.selectOptions(screen.getByLabelText('Condition'), 'between');
        await user.type(screen.getByLabelText('Value'), '10, 50');
        await user.click(screen.getByRole('button', { name: 'Preview' }));

        await waitFor(() => expect(previewChart).toHaveBeenCalledTimes(1));
        expect(previewChart).toHaveBeenCalledWith({
            datasetId: testDataset.dataset.id,
            chartType: 'heatmap',
            config: expect.objectContaining({
                kind: 'heatmap',
                x: { columnId: 'city' },
                y: { columnId: 'country' },
                measure: { aggregate: 'avg', columnId: 'score', valueFormat: 'kg' },
                filters: [{ columnId: 'score', op: 'between', value: [10, 50] }],
            }),
        });
    });

    it('stores custom formats for each visible measure', async () => {
        const user = userEvent.setup();

        renderDatasetChartBuilder({ selectedDataset: testDataset });

        await user.type(screen.getByLabelText('Value format'), 'rows');
        await user.click(screen.getByRole('button', { name: 'Add measure' }));
        await user.selectOptions(screen.getByLabelText('Column'), 'score');
        await user.type(screen.getAllByLabelText('Value format')[1], 'pts');
        await user.click(screen.getByRole('button', { name: 'Preview' }));

        await waitFor(() => expect(previewChart).toHaveBeenCalledTimes(1));
        expect(previewChart).toHaveBeenCalledWith(
            expect.objectContaining({
                chartType: 'bar',
                config: expect.objectContaining({
                    measures: [
                        { aggregate: 'count', valueFormat: 'rows' },
                        { aggregate: 'avg', columnId: 'score', valueFormat: 'pts' },
                    ],
                }),
            })
        );
    });

    it('saves edited chart without requesting preview', async () => {
        const user = userEvent.setup();
        const onChartUpdated = vi.fn();

        renderDatasetChartBuilder({
            selectedDataset: testDataset,
            editChartId: 'chart-1',
            onChartUpdated,
        });

        await user.selectOptions(screen.getByLabelText('Aggregation'), 'avg');
        await user.selectOptions(screen.getByLabelText('Column'), 'score');
        await user.click(screen.getByRole('button', { name: /^save$/i }));

        await waitFor(() => expect(updateChart).toHaveBeenCalledTimes(1));
        expect(previewChart).not.toHaveBeenCalled();
        expect(updateChart).toHaveBeenCalledWith(
            expect.objectContaining({
                chartId: 'chart-1',
                config: expect.objectContaining({
                    measures: [
                        {
                            aggregate: 'avg',
                            columnId: 'score',
                        },
                    ],
                }),
            })
        );
        expect(onChartUpdated).toHaveBeenCalledWith('chart-1');
    });

    it('emits controlled field changes without writing localStorage', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const setItem = vi.spyOn(Storage.prototype, 'setItem');

        renderDatasetChartBuilder({
            selectedDataset: testDataset,
            value: createChartBuilderFields(),
            onChange,
        });

        await user.selectOptions(screen.getByLabelText('Chart type'), 'line');

        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({ chartType: 'line' })
        );
        expect(setItem).not.toHaveBeenCalled();
        setItem.mockRestore();
    });
});
