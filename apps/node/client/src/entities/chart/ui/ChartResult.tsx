import type { ReactNode } from 'react';

import type { ChartKind } from '../lib/chartKind';
import { formatChartCell } from '../lib/formatChartCell';
import { parseChartResult } from '../lib/parseChartData';
import { BarChart } from './BarChart';
import { HeatmapChart, type HeatmapCell } from './HeatmapChart';
import { LineChart } from './LineChart';
import { PieChart } from './PieChart';

import styles from './ChartResult.module.scss';

type ChartResultColumn = { name: string; role?: 'dim' | 'series' | 'measure' };

type ChartResultData = {
    columns: ChartResultColumn[];
    rows: Array<Array<string | number | null>>;
    truncated: boolean;
};

const colDisplayName = (col: ChartResultColumn): string => {
    if (col.role === 'dim') return 'Category';
    if (col.role === 'series') return 'Series';
    if (col.role === 'measure') {
        if (col.name === 'm0') return 'Value';
        if (col.name === 'm1') return 'Value 2';
    }
    return col.name;
};

type ChartResultProps = {
    data: ChartResultData;
    ariaLabel: string;
    kind?: ChartKind;
    barsLimit?: number;
    hideTable?: boolean;
    children?: ReactNode;
};

export const ChartResult = ({
    data,
    ariaLabel,
    kind,
    barsLimit = 10,
    hideTable = false,
    children,
}: ChartResultProps) => {
    const activeKind = kind ?? 'bar';
    const chart = parseChartResult(data, activeKind, barsLimit);
    const heatmapRows = data.rows.filter(
        row => typeof row[2] === 'number' && Number.isFinite(row[2])
    );
    const heatmapCells: HeatmapCell[] = heatmapRows.map(row => ({
        x: String(row[0] ?? ''),
        y: String(row[1] ?? ''),
        value: row[2] as number,
    }));
    const heatmapWarnings =
        activeKind === 'heatmap' && heatmapRows.length !== data.rows.length
            ? ['Rows with non-numeric measure values were omitted.']
            : [];
    const warnings = [...new Set([...chart.warnings, ...heatmapWarnings])];

    const renderChart = () => {
        if (activeKind === 'heatmap') {
            if (heatmapCells.length === 0) {
                return (
                    <p className={styles['chart-unavailable']}>
                        No plottable values for this chart.
                    </p>
                );
            }

            return <HeatmapChart data={heatmapCells} />;
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
                return <LineChart series={chart.series} labels={chart.labels} />;
            case 'pie':
                return <PieChart data={chart.points} />;
            default:
                return <BarChart series={chart.series} labels={chart.labels} />;
        }
    };

    return (
        <div className={styles['root']} aria-label={ariaLabel}>
            <div className={styles['chart-wrap']}>{renderChart()}</div>

            {warnings.map(warning => (
                <div key={warning} role="status" className={styles['chart-warning']}>
                    {warning}
                </div>
            ))}

            {!hideTable && (
                <>
                    <div className={styles['table-wrap']}>
                        <table className={styles['table']}>
                            <thead>
                                <tr>
                                    {data.columns.map(column => (
                                        <th key={column.name}>{colDisplayName(column)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.map((row, index) => (
                                    <tr key={index}>
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex}>{formatChartCell(cell)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles['summary']}>
                        <span>{data.rows.length} result rows</span>
                        {data.truncated && <span>Result truncated</span>}
                        {children}
                    </div>
                </>
            )}
        </div>
    );
};
