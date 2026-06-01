import { Tooltip } from '@/shared/ui';

import { formatChartCell } from '../../../../lib/formatChartCell';

import { getFixedChartTooltipStyle, type ChartTooltipPoint } from '../../lib';
import type { HeatmapCell } from '../HeatmapChart';

import styles from './HeatmapChartTooltip.module.scss';

export type HoveredHeatmapCell = {
    cell: HeatmapCell;
    point: ChartTooltipPoint;
} | null;

type HeatmapChartTooltipProps = {
    hovered: HoveredHeatmapCell;
    maxWidth: number;
};

export const HeatmapChartTooltip = ({ hovered, maxWidth }: HeatmapChartTooltipProps) => {
    if (!hovered) {
        return null;
    }

    const { cell } = hovered;

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
                {formatChartCell(cell.x, { timeGranularity: cell.xTimeGranularity })}
                {' / '}
                {formatChartCell(cell.y, { timeGranularity: cell.yTimeGranularity })}
            </div>
            <span
                className={styles['tooltip-value']}
                data-display="inline-flex"
                data-align="center"
            >
                {formatChartCell(cell.value, { valueFormat: cell.valueFormat })}
            </span>
        </Tooltip>
    );
};
