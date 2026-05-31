import { lazy, type ReactNode } from 'react';

import { ClientOnlyDeffered } from '@/shared/ui/ClientOnlyDeffered';

import type { ChartResultColumn } from '../api';
import { BAR_CHART_ROWS_LIMIT } from '../const';
import type { ChartKind } from '../lib/chartKind';
import {
    parseChartResult,
    type ChartDataPoint,
    type ChartSeries,
} from '../lib/parseChartData';
import type { HeatmapCell } from './HeatmapChart.types';

import styles from './ChartResult.module.scss';

const LazyBarChart = lazy(() =>
    import('./BarChart').then(module => ({ default: module.BarChart }))
);
const LazyHeatmapChart = lazy(() =>
    import('./HeatmapChart').then(module => ({ default: module.HeatmapChart }))
);
const LazyLineChart = lazy(() =>
    import('./LineChart').then(module => ({ default: module.LineChart }))
);
const LazyPieChart = lazy(() =>
    import('./PieChart').then(module => ({ default: module.PieChart }))
);

type ChartResultData = {
    columns: Array<Partial<ChartResultColumn> & Pick<ChartResultColumn, 'name'>>;
    rows: Array<Array<string | number | null>>;
    truncated: boolean;
};

type ChartResultProps = {
    data: ChartResultData;
    ariaLabel: string;
    kind?: ChartKind;
    barsLimit?: number;
    hideTable?: boolean;
    frameless?: boolean;
    color?: string;
    children?: ReactNode;
};

type CartesianChartProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: ChartResultColumn['timeGranularity'];
    valueFormat?: ChartResultColumn['valueFormat'];
    color?: string;
};

type LineChartProps = CartesianChartProps & {
    showLegend?: boolean;
};

type PieChartProps = {
    data: ChartDataPoint[];
    color?: string;
};

type HeatmapChartProps = {
    data: HeatmapCell[];
    color?: string;
};

const getFirstColumnByRole = (
    columns: ChartResultData['columns'],
    role: ChartResultColumn['role']
) => columns.find(column => column.role === role);

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

export const ChartResult = ({
    data,
    ariaLabel,
    kind,
    barsLimit = BAR_CHART_ROWS_LIMIT,
    hideTable = false,
    frameless = false,
    children,
    color,
}: ChartResultProps) => {
    const activeKind = kind ?? 'bar';
    const chart = parseChartResult(data, activeKind, barsLimit);
    const xColumn = data.columns[0];
    const yColumn = data.columns[1];
    const measureColumn = getFirstColumnByRole(data.columns, 'measure');
    const hasBreakdown = Boolean(getFirstColumnByRole(data.columns, 'series'));
    const heatmapRows = data.rows.filter(
        row => typeof row[2] === 'number' && Number.isFinite(row[2])
    );
    const heatmapCells: HeatmapCell[] = heatmapRows.map(row => ({
        x: String(row[0] ?? ''),
        y: String(row[1] ?? ''),
        value: row[2] as number,
        xType: xColumn?.type,
        yType: yColumn?.type,
        xTimeGranularity: xColumn?.timeGranularity,
        yTimeGranularity: yColumn?.timeGranularity,
        valueFormat: measureColumn?.valueFormat,
    }));
    const heatmapWarnings =
        activeKind === 'heatmap' && heatmapRows.length !== data.rows.length
            ? ['Rows with non-numeric measure values were omitted.']
            : [];

    const chartWarnings = [
        ...new Set([
            ...chart.warnings.filter(w => !w.startsWith('Chart preview shows')),
            ...heatmapWarnings,
        ]),
    ];
    const className = [
        styles['root'],
        frameless ? styles['frameless'] : '',
        hideTable ? styles['visual-only'] : '',
    ]
        .filter(Boolean)
        .join(' ');

    const renderChart = () => {
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
                    componentProps={{ data: heatmapCells, color }}
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

        switch (activeKind) {
            case 'line':
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
                            showLegend: hasBreakdown,
                        }}
                    />
                );
            case 'pie':
                return (
                    <ClientOnlyDeffered<PieChartProps>
                        fallback={chartFallback}
                        LazyComponent={LazyPieChart}
                        componentProps={{ data: chart.points, color }}
                    />
                );
            default:
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
                        }}
                    />
                );
        }
    };

    return (
        <div
            className={className}
            data-stack="v"
            data-gap="md"
            data-p={frameless ? undefined : 'md'}
            aria-label={ariaLabel}
        >
            <div className={styles['chart-wrap']}>{renderChart()}</div>

            {chartWarnings.map(warning => (
                <div
                    key={warning}
                    role="status"
                    className={styles['chart-warning']}
                    data-px="md"
                    data-py="sm"
                >
                    {warning}
                </div>
            ))}

            {(children || (!hideTable && (data.rows.length > 0 || data.truncated))) && (
                <div
                    className={styles['summary']}
                    data-stack="h"
                    data-gap="sm"
                    data-wrap="wrap"
                >
                    {!hideTable && <span>{data.rows.length} result rows</span>}
                    {!hideTable && data.truncated && <span>Result truncated</span>}
                    {children}
                </div>
            )}
        </div>
    );
};
