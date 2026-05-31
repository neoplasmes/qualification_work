import { lazy } from 'react';

import { ClientOnlyDeffered } from '@/shared/ui/ClientOnlyDeffered';

import type { ChartResultColumn } from '../../../../api';
import type { ChartKind } from '../../../../lib/chartKind';
import type {
    ChartDataPoint,
    ChartSeries,
    ChartViewModel,
} from '../../../../lib/parseChartData';

import type { ChartFrameHeight } from '../../lib';
import type { HeatmapCell } from '../HeatmapChart';

import styles from '../../ChartShell.module.scss';

const LazyBarChart = lazy(() =>
    import('../BarChart/BarChart').then(module => ({ default: module.BarChart }))
);
const LazyHeatmapChart = lazy(() =>
    import('../HeatmapChart/HeatmapChart').then(module => ({
        default: module.HeatmapChart,
    }))
);
const LazyLineChart = lazy(() =>
    import('../LineChart/LineChart').then(module => ({ default: module.LineChart }))
);
const LazyPieChart = lazy(() =>
    import('../PieChart/PieChart').then(module => ({ default: module.PieChart }))
);

type CartesianChartProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: ChartResultColumn['timeGranularity'];
    valueFormat?: ChartResultColumn['valueFormat'];
    color?: string;
    height?: ChartFrameHeight;
    showAxisTickLabels?: boolean;
};

type LineChartProps = CartesianChartProps & {
    showLegend?: boolean;
};

type PieChartProps = {
    data: ChartDataPoint[];
    color?: string;
    height?: ChartFrameHeight;
};

type HeatmapChartProps = {
    data: HeatmapCell[];
    color?: string;
    height?: ChartFrameHeight;
    showAxisTickLabels?: boolean;
};

type ChartRendererProps = {
    activeKind: ChartKind;
    chart: ChartViewModel;
    chartHeight?: ChartFrameHeight;
    color?: string;
    hasBreakdown: boolean;
    heatmapCells: HeatmapCell[];
    showAxisTickLabels: boolean;
    showLegend: boolean;
};

const chartFallback = (
    <div
        className={styles['chart-loading']}
        data-stack="h"
        data-align="center"
        data-justify="center"
    >
        Loading chart...
    </div>
);

export const ChartRenderer = ({
    activeKind,
    chart,
    chartHeight,
    color,
    hasBreakdown,
    heatmapCells,
    showAxisTickLabels,
    showLegend,
}: ChartRendererProps) => {
    if (activeKind === 'heatmap') {
        if (heatmapCells.length === 0) {
            return (
                <p className={styles['chart-unavailable']}>
                    No plottable values for this chart.
                </p>
            );
        }

        return (
            <ClientOnlyDeffered<HeatmapChartProps>
                fallback={chartFallback}
                LazyComponent={LazyHeatmapChart}
                componentProps={{
                    data: heatmapCells,
                    color,
                    height: chartHeight,
                    showAxisTickLabels,
                }}
            />
        );
    }

    if (chart.points.length === 0) {
        return (
            <p className={styles['chart-unavailable']}>
                No plottable values for this chart.
            </p>
        );
    }

    if (activeKind === 'line') {
        return (
            <ClientOnlyDeffered<LineChartProps>
                fallback={chartFallback}
                LazyComponent={LazyLineChart}
                componentProps={{
                    series: chart.series,
                    labels: chart.labels,
                    labelTimeGranularity: chart.labelTimeGranularity,
                    valueFormat: chart.valueFormat,
                    color,
                    height: chartHeight,
                    showAxisTickLabels,
                    showLegend: showLegend && hasBreakdown,
                }}
            />
        );
    }

    if (activeKind === 'pie') {
        return (
            <ClientOnlyDeffered<PieChartProps>
                fallback={chartFallback}
                LazyComponent={LazyPieChart}
                componentProps={{
                    data: chart.points,
                    color,
                    height: chartHeight,
                }}
            />
        );
    }

    return (
        <ClientOnlyDeffered<CartesianChartProps>
            fallback={chartFallback}
            LazyComponent={LazyBarChart}
            componentProps={{
                series: chart.series,
                labels: chart.labels,
                labelTimeGranularity: chart.labelTimeGranularity,
                valueFormat: chart.valueFormat,
                color,
                height: chartHeight,
                showAxisTickLabels,
            }}
        />
    );
};
