import {
    dashboardChartMinHeight,
    dashboardChartMinWidth,
    dashboardMetricMinHeight,
    dashboardMetricMinWidth,
} from '@qualification-work/types';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChartResponse } from '@/entities/chart';
import type { DatasetColumn } from '@/entities/dataset';

import { dashboardsTestIds } from '../../../const';

import { DashboardWidgets } from './DashboardWidgets';
import { gridMocks } from './DashboardWidgets.gridStackMock';
import { chart, items, secondChart } from './DashboardWidgets.testData';
import { ChartWidget } from './ui/ChartWidget';
import { MetricWidget } from './ui/MetricWidget';

const chartItem = items[0] as Extract<(typeof items)[number], { kind: 'chart' }>;

const mocks = vi.hoisted(() => ({
    getChartData: vi.fn().mockReturnValue({
        currentData: undefined,
        isLoading: false,
        isFetching: false,
        isError: false,
    }),
    navigate: vi.fn(),
}));

vi.mock('gridstack', () => ({
    GridStack: {
        init: vi.fn((_options, container: HTMLElement) => {
            gridMocks.setContainer(container);

            return gridMocks.grid;
        }),
    },
}));

vi.mock('react-router', async importActual => {
    const actual = await importActual<object>();

    return {
        ...actual,
        useNavigate: () => mocks.navigate,
    };
});

vi.mock('@visx/responsive', () => ({
    ParentSize: ({
        children,
    }: {
        children: (size: { width: number; height: number }) => ReactNode;
    }) => children({ width: 240, height: 64 }),
}));

vi.mock('@/entities/chart', () => ({
    BAR_CHART_ROWS_LIMIT: 12,
    ChartCard: ({
        data,
        chartHeight,
        descriptionSize,
        showAxisTickLabels,
        showDescription,
        showLegend,
        constrainAspectRatio,
    }: {
        data: ChartResponse;
        chartHeight?: string;
        descriptionSize?: string;
        showAxisTickLabels?: boolean;
        showDescription?: boolean;
        showLegend?: boolean;
        constrainAspectRatio?: boolean;
    }) => (
        <div
            data-testid="chart-result"
            data-chart-height={chartHeight}
            data-description-size={descriptionSize}
            data-show-axis-tick-labels={String(showAxisTickLabels)}
            data-show-description={String(showDescription)}
            data-show-legend={String(showLegend)}
            data-constrain-aspect-ratio={String(constrainAspectRatio)}
        >
            Aggregated at {data.aggregatedAt}
        </div>
    ),
    ChartShell: () => <div data-testid="chart-result" />,
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
            datasetNamesById={new Map([['dataset-1', 'Invoices']])}
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

const installResizeObserverSize = (width: number, height: number) => {
    const originalWindowResizeObserver = window.ResizeObserver;
    const originalGlobalResizeObserver = globalThis.ResizeObserver;

    class SizedResizeObserver implements ResizeObserver {
        constructor(private readonly callback: ResizeObserverCallback) {}

        observe(target: Element) {
            this.callback(
                [
                    {
                        target,
                        contentRect: {
                            width,
                            height,
                            top: 0,
                            left: 0,
                            bottom: height,
                            right: width,
                            x: 0,
                            y: 0,
                            toJSON: () => ({}),
                        },
                        borderBoxSize: [],
                        contentBoxSize: [],
                        devicePixelContentBoxSize: [],
                    },
                ],
                this
            );
        }

        unobserve() {}

        disconnect() {}
    }

    window.ResizeObserver = SizedResizeObserver;
    globalThis.ResizeObserver = SizedResizeObserver;

    return () => {
        window.ResizeObserver = originalWindowResizeObserver;
        globalThis.ResizeObserver = originalGlobalResizeObserver;
    };
};

const chartResponse: ChartResponse = {
    kind: 'bar',
    columns: [],
    rows: [],
    truncated: false,
    aggregatedAt: '2026-05-28T13:37:00.000Z',
};
const metricColumns = [
    {
        id: 'column-score',
        datasetId: 'dataset-1',
        key: 'score',
        displayName: 'Score',
        dataType: 'number',
        orderIndex: 0,
        isAnalyzable: true,
    },
    {
        id: 'column-created-at',
        datasetId: 'dataset-1',
        key: 'created_at',
        displayName: 'Created at',
        dataType: 'date',
        orderIndex: 1,
        isAnalyzable: true,
    },
] satisfies DatasetColumn[];
const metricWithTrend = {
    ...items[1],
    value: 396.48,
    format: '₽',
    valueMultiplier: 1,
    target: 350,
    targetDirection: 'higher',
    showTrend: true,
    timeColumn: 'created_at',
    timeBucket: 'month',
    trend: [
        { bucket: '2025-01-01T00:00:00.000Z', value: 401 },
        { bucket: '2025-02-01T00:00:00.000Z', value: 379 },
        { bucket: '2025-03-01T00:00:00.000Z', value: 398 },
    ],
} as Extract<(typeof items)[number], { kind: 'metric' }>;

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
        await user.click(screen.getByLabelText('Edit Revenue'));
        await user.click(screen.getByLabelText('Edit Average score'));
        await user.click(screen.getByLabelText('Remove Average score'));
        await user.click(screen.getByLabelText('Remove Revenue'));

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
            'false'
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
        expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
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
            expect(screen.getByText('| month')).toBeInTheDocument();
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

    it('hides dashboard chart description and axis labels from measured pixels', async () => {
        const restoreResizeObserver = installResizeObserverSize(420, 255);
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
