import {
    dashboardChartMinHeight,
    dashboardChartMinWidth,
    dashboardMetricMinHeight,
    dashboardMetricMinWidth,
} from '@qualification-work/types';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChartResponse } from '@/entities/chart';

import { dashboardsTestIds } from '../../../const';

import { DashboardWidgets } from './DashboardWidgets';
import { gridMocks } from './DashboardWidgets.gridStackMock';
import { chart, items, secondChart } from './DashboardWidgets.testData';

const mocks = vi.hoisted(() => ({
    getChartData: vi
        .fn()
        .mockReturnValue({ data: undefined, isLoading: false, isFetching: false }),
}));

vi.mock('gridstack', () => ({
    GridStack: {
        init: vi.fn((_options, container: HTMLElement) => {
            gridMocks.setContainer(container);

            return gridMocks.grid;
        }),
    },
}));

vi.mock('@/entities/chart', () => ({
    BAR_CHART_ROWS_LIMIT: 12,
    ChartCard: ({ data }: { data: ChartResponse }) => (
        <div data-testid="chart-result">Aggregated at {data.aggregatedAt}</div>
    ),
    ChartResult: () => <div data-testid="chart-result" />,
    getChartColorFromConfig: () => '#8a6cff',
    useGetChartDataQuery: (chartId: string) => mocks.getChartData(chartId),
}));

const renderWidgets = (props: Partial<Parameters<typeof DashboardWidgets>[0]> = {}) =>
    render(
        <DashboardWidgets
            items={items}
            chartsById={
                new Map([
                    [chart.id, chart],
                    [secondChart.id, secondChart],
                ])
            }
            datasetColumnsById={new Map()}
            removing={false}
            onLayoutChange={vi.fn()}
            onRemoveItem={vi.fn()}
            onEditMetric={vi.fn()}
            {...props}
        />
    );

const getAllByDataTestId = (container: HTMLElement, testId: string) =>
    container.querySelectorAll(`[data-test-id="${testId}"]`);

const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element = container.querySelector<T>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as T;
};

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
        expect(screen.getByText(/42\s?%/)).toBeInTheDocument();

        await user.click(screen.getByLabelText('Edit Average score'));
        await user.click(screen.getByLabelText('Remove Average score'));
        await user.click(screen.getByLabelText('Remove Revenue'));

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

    it('disables GridStack movement and resize while projected to one column', async () => {
        gridMocks.setColumn(1);

        renderWidgets();

        await waitFor(() =>
            expect(gridMocks.grid.enableMove).toHaveBeenCalledWith(false)
        );
        expect(gridMocks.grid.enableResize).toHaveBeenCalledWith(false);
    });

    it('auto-loads chart data for chart widgets on mount', async () => {
        mocks.getChartData.mockReturnValue({
            data: {
                kind: 'bar',
                columns: [],
                rows: [],
                truncated: false,
                aggregatedAt: '2026-05-28T13:37:00.000Z',
            },
            isLoading: false,
            isFetching: false,
        });

        renderWidgets({ items: [items[0]] });

        await waitFor(() => expect(mocks.getChartData).toHaveBeenCalledWith('chart-1'));
        expect(screen.getByTestId('chart-result')).toHaveTextContent(
            'Aggregated at 2026-05-28T13:37:00.000Z'
        );
    });
});
