import type { ReactNode } from 'react';

import type { ChartKind } from '../lib/chartKind';
import { formatChartCell } from '../lib/formatChartCell';
import { parseChartResult } from '../lib/parseChartData';

import { BarChart } from './BarChart';
import { HeatmapChart, type HeatmapCell } from './HeatmapChart';
import { LineChart } from './LineChart';
import { PieChart } from './PieChart';
import styles from './ChartResult.module.scss';

type ChartResultData = {
    columns: Array<{ name: string; role?: 'dim' | 'series' | 'measure' }>;
    rows: Array<Array<string | number | null>>;
    truncated: boolean;
};

type ChartResultProps = {
    data: ChartResultData;
    ariaLabel: string;
    kind?: ChartKind;
    barsLimit?: number;
    children?: ReactNode;
};

export const ChartResult = ({
    data,
    ariaLabel,
    kind,
    barsLimit = 10,
    children,
}: ChartResultProps) => {
    const activeKind = kind ?? 'bar';
    const chart = parseChartResult(data, activeKind, barsLimit);
    const heatmapCells: HeatmapCell[] = data.rows.map(row => ({
        x: String(row[0] ?? ''),
        y: String(row[1] ?? ''),
        value: typeof row[2] === 'number' ? row[2] : 0,
    }));

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
                return <LineChart data={chart.points} />;
            case 'pie':
                return <PieChart data={chart.points} />;
            default:
                return <BarChart data={chart.points} />;
        }
    };

    return (
        <div className={styles['root']} aria-label={ariaLabel}>
            <div className={styles['chart-wrap']}>{renderChart()}</div>

            {chart.warnings.map(warning => (
                <div key={warning} role="status" className={styles['chart-warning']}>
                    {warning}
                </div>
            ))}

            <div className={styles['table-wrap']}>
                <table className={styles['table']}>
                    <thead>
                        <tr>
                            {data.columns.map(column => (
                                <th key={column.name}>{column.name}</th>
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
        </div>
    );
};
