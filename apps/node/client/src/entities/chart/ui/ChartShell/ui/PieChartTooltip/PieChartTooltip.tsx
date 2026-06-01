import { Tooltip } from '@/shared/ui';

import { formatChartCell } from '../../../../lib/formatChartCell';
import type { ChartDataPoint } from '../../../../lib/parseChartData';

import { getFixedChartTooltipStyle, type ChartTooltipPoint } from '../../lib';

import styles from './PieChartTooltip.module.scss';

export type HoveredPieSlice = {
    datum: ChartDataPoint;
    pct: string;
    color: string;
    point: ChartTooltipPoint;
} | null;

type PieChartTooltipProps = {
    hovered: HoveredPieSlice;
    maxWidth: number;
};

export const PieChartTooltip = ({ hovered, maxWidth }: PieChartTooltipProps) => {
    if (!hovered) {
        return null;
    }

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
                {formatChartCell(hovered.datum.label, {
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
                <span
                    className={styles['tooltip-swatch']}
                    data-display="inline-block"
                    style={{ backgroundColor: hovered.color }}
                />
                <span
                    className={styles['tooltip-value']}
                    data-display="inline-flex"
                    data-align="center"
                >
                    {formatChartCell(hovered.datum.value, {
                        valueFormat: hovered.datum.valueFormat,
                    })}
                </span>
                <span
                    className={styles['tooltip-pct']}
                    data-display="inline-flex"
                    data-align="center"
                >
                    {hovered.pct}%
                </span>
            </div>
        </Tooltip>
    );
};
