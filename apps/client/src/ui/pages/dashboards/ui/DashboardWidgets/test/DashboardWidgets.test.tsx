import {
    chartItem,
    chartResponse,
    getAllByDataTestId,
    getByDataTestId,
    installResizeObserverSize,
    metricColumns,
    metricWithTrend,
    mocks,
    renderWidgets,
} from '.';
import { DashboardWidgets } from '..';
import {
    dashboardChartMinHeight,
    dashboardChartMinWidth,
    dashboardMetricMinHeight,
    dashboardMetricMinWidth,
} from '@qualification-work/types';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dashboardsTestIds } from '../../../const';

import { ChartWidget } from '../ui/ChartWidget';
import { MetricWidget } from '../ui/MetricWidget';
import { gridMocks } from './DashboardWidgets.gridStackMock';
import { chart, items } from './DashboardWidgets.testData';

describe('DashboardWidgets', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        gridMocks.reset();
    });

    it('renders widgets on the GridStack canvas and keeps item actions working', async () => {
        const user = userEvent.setup();
        const onLayoutChange = vi.fn();
        const onRemoveItem = vi.fn();
        const onEditMetric = vi.fn();

        const { container } = renderWidgets({
            onLayoutChange,
            onRemoveItem,
            onEditMetric,
        });

        await waitFor(() =>
            expect(gridMocks.grid.addWidget).toHaveBeenCalledTimes(items.length)
        );
        expect(getAllByDataTestId(container, dashboardsTestIds.chartWidget)).toHaveLength(
            2
        );
        expect(
            getByDataTestId(container, dashboardsTestIds.metricWidget)
        ).toHaveAttribute('title', 'Average score');
        expect(screen.getAllByText('Invoices')).toHaveLength(3);
        expect(screen.getByText(/42\s?%/)).toBeInTheDocument();
        await user.click(screen.getByLabelText('Изменить Revenue'));
        await user.click(screen.getByLabelText('Изменить Average score'));
        await user.click(screen.getByLabelText('Удалить Average score'));
        await user.click(screen.getByLabelText('Удалить Revenue'));

        expect(mocks.navigate).toHaveBeenCalledWith('/charts/edit?id=chart-1');
        expect(onEditMetric).toHaveBeenCalledWith(items[1]);
        expect(onRemoveItem).toHaveBeenCalledWith('item-metric');
        expect(onRemoveItem).toHaveBeenCalledWith('item-chart');
        expect(onLayoutChange).not.toHaveBeenCalled();
    });

    it('applies kind-specific minimum GridStack sizes', async () => {
        const { container } = renderWidgets();

        await waitFor(() =>
            expect(gridMocks.grid.addWidget).toHaveBeenCalledTimes(items.length)
        );

        const chartCell = container.querySelector('[gs-id="item-chart"]');
        const metricCell = container.querySelector('[gs-id="item-metric"]');
        expect(chartCell).toHaveAttribute('gs-min-w', String(dashboardChartMinWidth));
        expect(chartCell).toHaveAttribute('gs-min-h', String(dashboardChartMinHeight));
        expect(metricCell).toHaveAttribute('gs-min-w', String(dashboardMetricMinWidth));
        expect(metricCell).toHaveAttribute('gs-min-h', String(dashboardMetricMinHeight));
    });

    it('emits the full layout snapshot after drag or resize stops', async () => {
        const onLayoutChange = vi.fn();
        renderWidgets({ onLayoutChange });

        await waitFor(() =>
            expect(gridMocks.grid.addWidget).toHaveBeenCalledTimes(items.length)
        );
        Object.assign(gridMocks.node('item-metric') ?? {}, {
            x: 3,
            y: 0,
            w: 3,
            h: 2,
        });

        act(() => gridMocks.emit('dragstop'));

        expect(onLayoutChange).toHaveBeenCalledWith([
            { itemId: 'item-chart', posX: 0, posY: 0, width: 12, height: 8 },
            { itemId: 'item-metric', posX: 3, posY: 0, width: 3, height: 2 },
            { itemId: 'item-chart-2', posX: 0, posY: 10, width: 12, height: 8 },
        ]);
    });

    it('syncs prop layout changes without persisting them back', async () => {
        const onLayoutChange = vi.fn();
        const { rerender } = renderWidgets({ onLayoutChange });

        await waitFor(() =>
            expect(gridMocks.grid.addWidget).toHaveBeenCalledTimes(items.length)
        );

        rerender(
            <DashboardWidgets
                items={[
                    {
                        ...items[0],
                        layout: { posX: 4, posY: 1, width: 8, height: 8 },
                    },
                ]}
                chartsById={new Map([[chart.id, chart]])}
                datasetColumnsById={new Map()}
                datasetNamesById={new Map([['dataset-1', 'Invoices']])}
                removing={false}
                onLayoutChange={onLayoutChange}
                onRemoveItem={vi.fn()}
                onEditMetric={vi.fn()}
            />
        );

        await waitFor(() => expect(gridMocks.grid.update).toHaveBeenCalled());
        expect(onLayoutChange).not.toHaveBeenCalled();
        expect(gridMocks.node('item-chart')).toMatchObject({ x: 4, y: 1, w: 8, h: 8 });
    });

    it('keeps GridStack movement and resize enabled at any column count', async () => {
        gridMocks.setColumn(1);

        renderWidgets();

        await waitFor(() =>
            expect(gridMocks.grid.addWidget).toHaveBeenCalledTimes(items.length)
        );
        expect(gridMocks.grid.enableMove).not.toHaveBeenCalledWith(false);
        expect(gridMocks.grid.enableResize).not.toHaveBeenCalledWith(false);
    });

    it('auto-loads chart data for chart widgets on mount', async () => {
        mocks.getChartData.mockReturnValue({
            currentData: chartResponse,
            isLoading: false,
            isFetching: false,
            isError: false,
        });

        renderWidgets({ items: [items[0]] });

        await waitFor(() => expect(mocks.getChartData).toHaveBeenCalledWith('chart-1'));
        expect(screen.getByTestId('chart-result')).toHaveTextContent(
            'Aggregated at 2026-05-28T13:37:00.000Z'
        );
        expect(screen.getByTestId('chart-result')).toHaveAttribute(
            'data-chart-height',
            'fill'
        );
        expect(screen.getByTestId('chart-result')).toHaveAttribute(
            'data-description-size',
            'small'
        );
        expect(screen.getByTestId('chart-result')).toHaveAttribute(
            'data-show-description',
            'true'
        );
        expect(screen.getByTestId('chart-result')).toHaveAttribute(
            'data-show-axis-tick-labels',
            'true'
        );
        expect(screen.getByTestId('chart-result')).toHaveAttribute(
            'data-show-legend',
            'true'
        );
        expect(screen.getByTestId('chart-result')).toHaveAttribute(
            'data-constrain-aspect-ratio',
            'true'
        );
    });

    it('keeps cached chart data visible during a background refetch', async () => {
        mocks.getChartData.mockReturnValue({
            currentData: chartResponse,
            isLoading: false,
            isFetching: true,
            isError: false,
        });

        renderWidgets({ items: [items[0]] });

        await waitFor(() => expect(mocks.getChartData).toHaveBeenCalledWith('chart-1'));
        expect(screen.queryByText('Загружаем данные графика…')).not.toBeInTheDocument();
        expect(screen.getByTestId('chart-result')).toHaveTextContent(
            'Aggregated at 2026-05-28T13:37:00.000Z'
        );
    });

    it('shows metric sparkline context and hides progress while sparkline is visible', async () => {
        const restoreResizeObserver = installResizeObserverSize(260, 220);

        try {
            render(
                <MetricWidget
                    item={metricWithTrend}
                    columns={metricColumns}
                    removing={false}
                    onRemoveItem={vi.fn()}
                    onEditItem={vi.fn()}
                />
            );

            expect(await screen.findByText('Created at')).toBeInTheDocument();
            expect(screen.getByText('| Месяц')).toBeInTheDocument();
            expect(screen.getByText('+13,3%')).toBeInTheDocument();
            expect(screen.queryByRole('meter')).not.toBeInTheDocument();
        } finally {
            restoreResizeObserver();
        }
    });

    it('uses progress fallback for trend metrics below the sparkline height threshold', async () => {
        const restoreResizeObserver = installResizeObserverSize(260, 139);

        try {
            render(
                <MetricWidget
                    item={metricWithTrend}
                    columns={metricColumns}
                    removing={false}
                    onRemoveItem={vi.fn()}
                    onEditItem={vi.fn()}
                />
            );

            await waitFor(() => expect(screen.getByRole('meter')).toBeInTheDocument());
            expect(screen.queryByText('Created at')).not.toBeInTheDocument();
        } finally {
            restoreResizeObserver();
        }
    });

    it('hides metric sparkline description below compact card thresholds', async () => {
        const restoreResizeObserver = installResizeObserverSize(199, 220);

        try {
            render(
                <MetricWidget
                    item={metricWithTrend}
                    columns={metricColumns}
                    removing={false}
                    onRemoveItem={vi.fn()}
                    onEditItem={vi.fn()}
                />
            );

            await waitFor(() =>
                expect(screen.queryByRole('meter')).not.toBeInTheDocument()
            );
            expect(screen.queryByText('Created at')).not.toBeInTheDocument();
        } finally {
            restoreResizeObserver();
        }
    });

    it('hides chart details and legend when the measured plot area is small', async () => {
        const restoreResizeObserver = installResizeObserverSize(420, 180);
        mocks.getChartData.mockReturnValue({
            currentData: chartResponse,
            isLoading: false,
            isFetching: false,
            isError: false,
        });

        render(
            <ChartWidget
                item={chartItem}
                chart={chart}
                columns={[]}
                removing={false}
                onRemoveItem={vi.fn()}
            />
        );

        await waitFor(() => expect(mocks.getChartData).toHaveBeenCalledWith('chart-1'));
        expect(screen.getByTestId('chart-result')).toHaveAttribute(
            'data-show-description',
            'false'
        );
        expect(screen.getByTestId('chart-result')).toHaveAttribute(
            'data-show-axis-tick-labels',
            'false'
        );
        expect(screen.getByTestId('chart-result')).toHaveAttribute(
            'data-show-legend',
            'false'
        );

        restoreResizeObserver();
    });

    it('keeps axis labels when only the description height threshold is crossed', async () => {
        const restoreResizeObserver = installResizeObserverSize(420, 319);
        mocks.getChartData.mockReturnValue({
            currentData: chartResponse,
            isLoading: false,
            isFetching: false,
            isError: false,
        });

        render(
            <ChartWidget
                item={chartItem}
                chart={chart}
                columns={[]}
                removing={false}
                onRemoveItem={vi.fn()}
            />
        );

        await waitFor(() => expect(mocks.getChartData).toHaveBeenCalledWith('chart-1'));
        expect(screen.getByTestId('chart-result')).toHaveAttribute(
            'data-show-description',
            'false'
        );
        expect(screen.getByTestId('chart-result')).toHaveAttribute(
            'data-show-axis-tick-labels',
            'true'
        );

        restoreResizeObserver();
    });
});
