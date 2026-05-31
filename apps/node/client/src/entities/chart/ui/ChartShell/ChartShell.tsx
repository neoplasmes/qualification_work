import { type ReactNode } from 'react';

import type { ChartResultColumn } from '../../api';
import { BAR_CHART_ROWS_LIMIT } from '../../const';
import type { ChartKind } from '../../lib/chartKind';
import { parseChartResult } from '../../lib/parseChartData';
import type { ChartFrameHeight } from './lib';
import { ChartRenderer } from './ui/ChartRenderer';
import type { HeatmapCell } from './ui/HeatmapChart';

import styles from './ChartShell.module.scss';

type ChartShellData = {
    columns: Array<Partial<ChartResultColumn> & Pick<ChartResultColumn, 'name'>>;
    rows: Array<Array<string | number | null>>;
    truncated: boolean;
};

type ChartShellProps = {
    data: ChartShellData;
    ariaLabel: string;
    kind?: ChartKind;
    barsLimit?: number;
    frameless?: boolean;
    transparentBackground?: boolean;
    color?: string;
    chartHeight?: ChartFrameHeight;
    showAxisTickLabels?: boolean;
    showResultSummary?: boolean;
    showLegend?: boolean;
    children?: ReactNode;
};

const getFirstColumnByRole = (
    columns: ChartShellData['columns'],
    role: ChartResultColumn['role']
) => columns.find(column => column.role === role);

export const ChartShell = ({
    data,
    ariaLabel,
    kind,
    barsLimit = BAR_CHART_ROWS_LIMIT,
    frameless = false,
    transparentBackground = false,
    children,
    color,
    chartHeight,
    showAxisTickLabels = true,
    showResultSummary = true,
    showLegend = true,
}: ChartShellProps) => {
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
            ...chart.warnings.filter(
                warning => !warning.startsWith('Chart preview shows')
            ),
            ...heatmapWarnings,
        ]),
    ];
    const className = [
        styles['root'],
        transparentBackground ? styles['transparent-background'] : '',
        frameless ? styles['frameless'] : '',
        !showResultSummary ? styles['visual-only'] : '',
        chartHeight === 'fill' ? styles['height-fill'] : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={className}
            data-stack="v"
            data-gap="md"
            data-p={frameless ? undefined : 'md'}
            aria-label={ariaLabel}
        >
            <div className={styles['chart-wrap']}>
                <ChartRenderer
                    activeKind={activeKind}
                    chart={chart}
                    chartHeight={chartHeight}
                    color={color}
                    hasBreakdown={hasBreakdown}
                    heatmapCells={heatmapCells}
                    showAxisTickLabels={showAxisTickLabels}
                    showLegend={showLegend}
                />
            </div>

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

            {(children ||
                (showResultSummary && (data.rows.length > 0 || data.truncated))) && (
                <div
                    className={styles['summary']}
                    data-stack="h"
                    data-gap="sm"
                    data-wrap="wrap"
                >
                    {showResultSummary && <span>{data.rows.length} result rows</span>}
                    {showResultSummary && data.truncated && <span>Result truncated</span>}
                    {children}
                </div>
            )}
        </div>
    );
};
