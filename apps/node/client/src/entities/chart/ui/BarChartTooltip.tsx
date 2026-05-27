import { formatChartCell } from '../lib/formatChartCell';
import type { ChartDataPoint, ChartSeries } from '../lib/parseChartData';
import {
    formatDelta,
    formatTooltipValue,
    getPreviousPoint,
    tooltipStyle,
} from './BarChart.config';

export type HoveredBar = {
    datum: ChartDataPoint;
    label: string;
    seriesName: string;
    x: number;
    y: number;
} | null;

type BarChartTooltipProps = {
    hovered: HoveredBar;
    series: ChartSeries[];
    width: number;
};

export const BarChartTooltip = ({ hovered, series, width }: BarChartTooltipProps) => {
    if (!hovered) {
        return null;
    }

    const previous = getPreviousPoint(series, hovered.seriesName, hovered.datum);
    const delta = formatDelta(hovered.datum, previous);
    const placeLeft = hovered.x > width - 220;

    return (
        <div
            data-stack="v"
            data-gap="xs"
            style={{
                ...tooltipStyle,
                position: 'absolute',
                zIndex: 2,
                top: hovered.y,
                left: placeLeft ? hovered.x - 12 : hovered.x + 12,
                maxWidth: 220,
                padding: '8px 10px',
                pointerEvents: 'none',
                transform: placeLeft ? 'translate(-100%, -50%)' : 'translateY(-50%)',
            }}
        >
            <strong>
                {formatChartCell(hovered.label, {
                    timeGranularity: hovered.datum.labelTimeGranularity,
                })}
            </strong>
            <span>
                {formatTooltipValue(hovered.datum)}
                {series.length > 1 ? ` ${hovered.seriesName}` : ''}
                {delta && <span style={{ color: delta.tone }}> {delta.text}</span>}
            </span>
        </div>
    );
};
