import { DashboardWidgets } from '..';
import type { DatasetColumn } from '@/core/entities/datasetColumn';
import type { ChartResponse } from '@qualification-work/types';
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { expect, vi, type Mock } from 'vitest';

import { gridMocks } from './DashboardWidgets.gridStackMock';
import { chart, items, secondChart } from './DashboardWidgets.testData';

vi.mock('@/ui/di/dependencies', () => ({
    useDependencies: () => ({ getChartData: { name: 'getChartData' } }),
}));
vi.mock('@/env/cache/useRead', () => ({
    useRead: (_query: unknown, input: { chartId: string }) => {
        const result = mocks.getChartData(input.chartId);

        return {
            data: result.currentData,
            isPending: result.isLoading,
            isFetching: result.isFetching,
            error: result.isError ? new Error('read failed') : null,
        };
    },
}));

export const chartItem = items[0] as Extract<(typeof items)[number], { kind: 'chart' }>;

const mocks: Record<'getChartData' | 'navigate', Mock> = vi.hoisted(() => ({
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
        Link: ({ to, children, ...props }: { to: string; children: ReactNode }) =>
            createElement(
                'a',
                {
                    ...props,
                    href: to,
                    onClick: (event: MouseEvent) => {
                        event.preventDefault();
                        mocks.navigate(to);
                    },
                },
                children
            ),
    };
});

vi.mock('@visx/responsive', () => ({
    ParentSize: ({
        children,
    }: {
        children: (size: { width: number; height: number }) => ReactNode;
    }) => children({ width: 240, height: 64 }),
}));

vi.mock('@/ui/pages/dashboards/ui/ChartCard', () => ({
    barChartRowsLimit: 12,
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
}));

export const renderWidgets = (
    props: Partial<Parameters<typeof DashboardWidgets>[0]> = {}
): RenderResult =>
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

export const getAllByDataTestId = (container: HTMLElement, testId: string) =>
    container.querySelectorAll(`[data-test-id="${testId}"]`);

export const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element = container.querySelector<T>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as T;
};

export const installResizeObserverSize = (width: number, height: number) => {
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

export const chartResponse: ChartResponse = {
    kind: 'bar',
    columns: [],
    rows: [],
    truncated: false,
    aggregatedAt: '2026-05-28T13:37:00.000Z',
};
export const metricColumns = [
    {
        ref: 'datasetColumn:org-1/dataset-1/column-score',
        id: 'column-score',
        datasetId: 'dataset-1',
        key: 'score',
        displayName: 'Score',
        dataType: 'number',
        orderIndex: 0,
        isAnalyzable: true,
    },
    {
        ref: 'datasetColumn:org-1/dataset-1/column-created-at',
        id: 'column-created-at',
        datasetId: 'dataset-1',
        key: 'created_at',
        displayName: 'Created at',
        dataType: 'date',
        orderIndex: 1,
        isAnalyzable: true,
    },
] satisfies DatasetColumn[];
export const metricWithTrend = {
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

export { mocks };
