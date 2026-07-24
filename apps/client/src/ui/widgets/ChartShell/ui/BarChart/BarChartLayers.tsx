import { scaleBand } from '@visx/scale';
import { DataContext } from '@visx/xychart';
import { useContext } from 'react';

import { formatCompactChartNumber } from '../../lib/formatChartCell';
import type { ChartSeries } from '../../lib/parseChartData';
import {
    chartColors,
    groupPadding,
    maxValueLabelBars,
    minValueLabelW,
} from './barChartConfig';

type ValueScale = (value: number) => number | undefined;
type BandScale = (value: string) => number | undefined;

type LabelBox = {
    left: number;
    right: number;
    top: number;
    bottom: number;
};

const labelCharW = 7;
const labelH = 16;
const labelGap = 6;

const getBandWidth = (xScale: unknown) =>
    typeof (xScale as { bandwidth?: () => number }).bandwidth === 'function'
        ? (xScale as { bandwidth: () => number }).bandwidth()
        : 0;

const hasCollision = (box: LabelBox, accepted: LabelBox[]) =>
    accepted.some(
        item =>
            box.left < item.right + labelGap &&
            box.right + labelGap > item.left &&
            box.top < item.bottom + labelGap &&
            box.bottom + labelGap > item.top
    );

const useScales = () => {
    const { xScale, yScale } = useContext(DataContext);

    if (!xScale || !yScale) {
        return null;
    }

    const bandwidth = getBandWidth(xScale);
    if (bandwidth <= 0) {
        return null;
    }

    return {
        bandwidth,
        xBand: xScale as unknown as BandScale,
        yLinear: yScale as unknown as ValueScale,
    };
};

export const ValueLabels = ({
    series,
    valueFormat,
}: {
    series: ChartSeries[];
    valueFormat?: string;
}) => {
    const scales = useScales();
    const totalBars = series.reduce((sum, item) => sum + item.points.length, 0);
    if (!scales || totalBars > maxValueLabelBars) {
        return null;
    }

    const { bandwidth, xBand, yLinear } = scales;
    const innerScale =
        series.length > 1
            ? scaleBand<string>({
                  domain: series.map(s => s.name),
                  range: [0, bandwidth],
                  padding: groupPadding,
              })
            : null;
    const barWidth = innerScale?.bandwidth() ?? bandwidth;
    if (barWidth < minValueLabelW) {
        return null;
    }

    const labels = series
        .flatMap((s, seriesIndex) =>
            s.points.map((p, pointIndex) => {
                const x0 = xBand(p.label);
                const x1 = innerScale ? innerScale(s.name) : 0;
                const y = yLinear(p.value);
                if (x0 == null || x1 == null || y == null) {
                    return null;
                }

                const text = formatCompactChartNumber(
                    p.value,
                    p.valueFormat ?? valueFormat
                );
                const x = x0 + x1 + barWidth / 2;
                const labelY = y - 8;
                const halfWidth = Math.max(text.length * labelCharW, minValueLabelW) / 2;

                return {
                    box: {
                        left: x - halfWidth,
                        right: x + halfWidth,
                        top: labelY - labelH,
                        bottom: labelY,
                    },
                    key: `${s.name}-${p.label}-value`,
                    order: seriesIndex * s.points.length + pointIndex,
                    priority: p.value,
                    text,
                    x,
                    y: labelY,
                };
            })
        )
        .filter(item => item !== null)
        .sort((a, b) => b.priority - a.priority)
        .reduce<
            Array<{
                box: LabelBox;
                key: string;
                order: number;
                text: string;
                x: number;
                y: number;
            }>
        >((accepted, item) => {
            if (
                !hasCollision(
                    item.box,
                    accepted.map(label => label.box)
                )
            ) {
                accepted.push(item);
            }

            return accepted;
        }, [])
        .sort((a, b) => a.order - b.order);

    return (
        <g pointerEvents="none">
            {labels.map(label => (
                <text
                    key={label.key}
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight={600}
                    fill={chartColors.muted}
                >
                    {label.text}
                </text>
            ))}
        </g>
    );
};

export const ReferenceLine = ({ value }: { value: number | null }) => {
    const { innerWidth, margin, yScale } = useContext(DataContext);
    if (value === null || !yScale || !innerWidth) {
        return null;
    }

    const rawY = (yScale as unknown as ValueScale)(value);
    if (rawY == null) {
        return null;
    }
    const y = Math.round(rawY) + 0.5;
    const left = margin?.left ?? 0;

    return (
        <g pointerEvents="none">
            <line
                x1={left}
                x2={left + innerWidth}
                y1={y}
                y2={y}
                stroke={chartColors.muted}
                strokeDasharray="4 5"
                strokeLinecap="butt"
                strokeOpacity={0.42}
                shapeRendering="crispEdges"
            />
        </g>
    );
};
