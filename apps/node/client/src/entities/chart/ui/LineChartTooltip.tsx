import { formatChartCell } from '../lib/formatChartCell';
import type { ChartDataPoint, ChartSeries } from '../lib/parseChartData';
import {
    formatDelta,
    formatTooltipValue,
    getPreviousPoint,
    tooltipStyle,
} from './BarChart.config';
import { getSeriesColor, stripGlyphSeriesSuffix } from './LineChart.config';

import styles from './LineChart.module.scss';

export type HoveredLinePoint = {
    datum: ChartDataPoint;
    seriesName: string;
    x: number;
    y: number;
} | null;

type LineChartTooltipProps = {
    hovered: HoveredLinePoint;
    series: ChartSeries[];
    color: string;
    width: number;
};

export const LineChartTooltip = ({
    hovered,
    series,
    color,
    width,
}: LineChartTooltipProps) => {
    if (!hovered) {
        return null;
    }

    const seriesName = stripGlyphSeriesSuffix(hovered.seriesName);
    const seriesIndex = series.findIndex(item => item.name === seriesName);
    const seriesColor = getSeriesColor(color, Math.max(seriesIndex, 0));
    const delta = formatDelta(
        hovered.datum,
        getPreviousPoint(series, seriesName, hovered.datum)
    );
    const placeLeft = hovered.x > width - 240;

    return (
        <div
            className={styles['tooltip']}
            data-stack="v"
            data-gap="xs"
            style={{
                ...tooltipStyle,
                position: 'absolute',
                zIndex: 4,
                top: hovered.y,
                left: placeLeft ? hovered.x - 12 : hovered.x + 12,
                maxWidth: 240,
                pointerEvents: 'none',
                transform: placeLeft ? 'translate(-100%, -50%)' : 'translateY(-50%)',
            }}
        >
            <div className={styles['tooltip-title']}>
                {formatChartCell(hovered.datum.label, {
                    timeGranularity: hovered.datum.labelTimeGranularity,
                })}
            </div>
            <div className={styles['tooltip-row']}>
                <span
                    className={styles['tooltip-swatch']}
                    style={{ backgroundColor: seriesColor }}
                />
                {series.length > 1 && (
                    <span className={styles['tooltip-name']}>{seriesName}</span>
                )}
                <span className={styles['tooltip-value']}>
                    {formatTooltipValue(hovered.datum)}
                </span>
                {delta && <span style={{ color: delta.tone }}>{delta.text}</span>}
            </div>
        </div>
    );
};
