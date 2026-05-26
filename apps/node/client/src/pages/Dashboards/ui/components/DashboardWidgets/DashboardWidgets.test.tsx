import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Chart } from '@/entities/chart';
import type { DashboardItem } from '@/entities/dashboard';

import { dashboardsTestIds } from '../../../const';

import { DashboardWidgets } from './DashboardWidgets';

const mocks = vi.hoisted(() => ({
    getChartData: vi
        .fn()
        .mockReturnValue({ data: undefined, isLoading: false, isFetching: false }),
}));

vi.mock('@/entities/chart', () => ({
    ChartResult: () => <div data-testid="chart-result" />,
    useGetChartDataQuery: (chartId: string) => mocks.getChartData(chartId),
}));

const chart: Chart = {
    id: 'chart-1',
    orgId: 'org-1',
    datasetId: 'dataset-1',
    name: 'Revenue',
    chartType: 'bar',
    config: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

const secondChart: Chart = {
    ...chart,
    id: 'chart-2',
    name: 'Costs',
};

const items: DashboardItem[] = [
    {
        id: 'item-chart',
        kind: 'chart',
        chartId: 'chart-1',
        layout: { posX: 0, posY: 0, width: 12, height: 8 },
    },
    {
        id: 'item-metric',
        kind: 'metric',
        datasetId: 'dataset-1',
        name: 'Average score',
        expression: 'avg(score)',
        format: 'percent',
        value: 0.42,
        layout: { posX: 0, posY: 8, width: 12, height: 4 },
    },
    {
        id: 'item-chart-2',
        kind: 'chart',
        chartId: 'chart-2',
        layout: { posX: 0, posY: 12, width: 12, height: 8 },
    },
];

const getAllByDataTestId = (container: HTMLElement, testId: string) =>
    Array.from(container.querySelectorAll(`[data-test-id="${testId}"]`));

describe('DashboardWidgets', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('moves chart widgets and removes metric widgets', async () => {
        const user = userEvent.setup();
        const onMoveItem = vi.fn();
        const onRemoveItem = vi.fn();

        const { container } = render(
            <DashboardWidgets
                items={items}
                chartsById={
                    new Map([
                        [chart.id, chart],
                        [secondChart.id, secondChart],
                    ])
                }
                reorderLoading={false}
                removing={false}
                onMoveItem={onMoveItem}
                onRemoveItem={onRemoveItem}
            />
        );

        expect(getAllByDataTestId(container, dashboardsTestIds.chartWidget)).toHaveLength(
            2
        );
        expect(
            getAllByDataTestId(container, dashboardsTestIds.metricWidget)
        ).toHaveLength(1);
        expect(screen.getByText(/42\s?%/)).toBeInTheDocument();
        expect(screen.queryByLabelText('Move Average score up')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('Move Revenue down'));
        await user.click(screen.getByLabelText('Move Costs up'));
        await user.click(screen.getByLabelText('Remove Average score'));

        expect(onMoveItem).toHaveBeenNthCalledWith(1, 'item-chart', 1);
        expect(onMoveItem).toHaveBeenNthCalledWith(2, 'item-chart-2', -1);
        expect(onRemoveItem).toHaveBeenCalledWith('item-metric');
    });

    it('auto-loads chart data for chart widgets on mount', () => {
        mocks.getChartData.mockReturnValue({
            data: { rows: [] },
            isLoading: false,
            isFetching: false,
        });

        render(
            <DashboardWidgets
                items={[items[0]]}
                chartsById={new Map([[chart.id, chart]])}
                reorderLoading={false}
                removing={false}
                onMoveItem={vi.fn()}
                onRemoveItem={vi.fn()}
            />
        );

        expect(mocks.getChartData).toHaveBeenCalledWith('chart-1');
    });
});
