import { Tooltip } from '@/shared/ui';

import { formatChartCell } from '../../../../lib/formatChartCell';
import type { ChartDataPoint, ChartSeries } from '../../../../lib/parseChartData';

import {
    formatDelta,
    formatTooltipValue,
    getFixedChartTooltipStyle,
    getPreviousPoint,
    type ChartTooltipPoint,
} from '../../lib';

import styles from './CartesianChartTooltip.module.scss';

export type HoveredCartesianPoint = {
    datum: ChartDataPoint;
    label?: string;
    seriesName: string;
    point: ChartTooltipPoint;
} | null;

type CartesianChartTooltipProps = {
    hovered: HoveredCartesianPoint;
    series: ChartSeries[];
    maxWidth: number;
    normalizeSeriesName?: (seriesName: string) => string;
    getSeriesColor?: (seriesName: string, seriesIndex: number) => string;
};

export const CartesianChartTooltip = ({
    hovered,
    series,
    maxWidth,
    normalizeSeriesName,
    getSeriesColor,
}: CartesianChartTooltipProps) => {
    if (!hovered) {
        return null;
    }

    const seriesName = normalizeSeriesName?.(hovered.seriesName) ?? hovered.seriesName;
    const seriesIndex = series.findIndex(item => item.name === seriesName);
    const resolvedSeriesIndex = Math.max(seriesIndex, 0);
    const seriesColor = getSeriesColor?.(seriesName, resolvedSeriesIndex);
    const previous = getPreviousPoint(series, seriesName, hovered.datum);
    const delta = formatDelta(hovered.datum, previous);
    const label = hovered.label ?? hovered.datum.label;

    return (
        <Tooltip
            className={styles['tooltip']}
            data-stack="v"
            data-gap="xs"
            data-align="center"
            data-px="sm"
            data-py="sm"
            style={getFixedChartTooltipStyle({
                ...hovered.point,
                maxWidth,
                zIndex: 2000,
            })}
        >
            <div className={styles['tooltip-title']} data-pb="xs">
                {formatChartCell(label, {
                    timeGranularity: hovered.datum.labelTimeGranularity,
                })}
            </div>
            <div
                className={styles['tooltip-row']}
                data-stack="h"
                data-gap="xs"
                data-align="center"
                data-justify="center"
            >
                {seriesColor && (
                    <span
                        className={styles['tooltip-swatch']}
                        data-display="inline-block"
                        style={{ backgroundColor: seriesColor }}
                    />
                )}
                {series.length > 1 && (
                    <span
                        className={styles['tooltip-name']}
                        data-display="inline-flex"
                        data-align="center"
                    >
                        {seriesName}
                    </span>
                )}
                <span
                    className={styles['tooltip-value']}
                    data-display="inline-flex"
                    data-align="center"
                >
                    {formatTooltipValue(hovered.datum)}
                </span>
                {delta && (
                    <span
                        className={styles['tooltip-delta']}
                        data-display="inline-flex"
                        data-align="center"
                        style={{ color: delta.tone }}
                    >
                        {delta.text}
                    </span>
                )}
            </div>
        </Tooltip>
    );
};
