import { ParentSize } from '@visx/responsive';
import {
    Axis,
    BarGroup,
    BarSeries,
    Grid,
    XYChart,
    type EventHandlerParams,
} from '@visx/xychart';
import { useMemo, useState } from 'react';

import type { MeasureValueFormat, TimeGranularity } from '../api';
import { DEFAULT_CHART_COLOR } from '../lib';
import { formatAxisNumber } from '../lib/formatChartCell';
import type { ChartDataPoint, ChartSeries } from '../lib/parseChartData';
import {
    C,
    CHART_HEIGHT,
    chartTheme,
    formatBarAxisLabel,
    getMedianValue,
    getSeriesColor,
    getValues,
    GROUP_PADDING,
    MIN_CHART_WIDTH,
    shouldRotateBarAxisLabels,
} from './BarChart.config';
import { GroupedBarLabels, ReferenceLine, ValueLabels } from './BarChart.layers';
import { BarChartTooltip, type HoveredBar } from './BarChartTooltip';

type BarChartGroupedInnerProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    color?: string;
    width: number;
    height: number;
};

const BarChartGroupedInner = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
    color = DEFAULT_CHART_COLOR,
    width,
    height,
}: BarChartGroupedInnerProps) => {
    const [hovered, setHovered] = useState<HoveredBar>(null);
    const rotateLabels = shouldRotateBarAxisLabels(labels, width, labelTimeGranularity);
    const values = useMemo(() => getValues(series), [series]);
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values) : 1;
    const medianValue = getMedianValue(values);
    const margin = { top: 32, right: 16, bottom: rotateLabels ? 112 : 48, left: 64 };

    const handlePointerMove = ({
        datum,
        distanceX,
        key,
        svgPoint,
    }: EventHandlerParams<ChartDataPoint>) => {
        if (distanceX !== 0) {
            return;
        }

        setHovered({
            datum,
            label: datum.label,
            seriesName: key,
            x: svgPoint?.x ?? 0,
            y: svgPoint?.y ?? 0,
        });
    };

    return (
        <div data-testid="bar-chart-svg" style={{ position: 'relative' }}>
            <XYChart
                accessibilityLabel="Grouped bar chart"
                width={width}
                height={height}
                margin={margin}
                theme={chartTheme}
                captureEvents={false}
                xScale={{ type: 'band', domain: labels, padding: 0.16 }}
                yScale={{
                    type: 'linear',
                    domain: [Math.min(0, minValue), Math.max(1, maxValue)],
                    nice: true,
                    zero: true,
                }}
            >
                <Grid columns={false} rows numTicks={4} stroke={C.grid} />
                <ReferenceLine value={medianValue} />
                <Axis
                    orientation="left"
                    numTicks={4}
                    tickFormat={v => formatAxisNumber(Number(v), valueFormat)}
                />
                <Axis
                    orientation="bottom"
                    numTicks={labels.length}
                    tickFormat={v =>
                        formatBarAxisLabel(v, rotateLabels, labelTimeGranularity)
                    }
                    tickLabelProps={() => ({
                        fill: C.muted,
                        fontSize: 11,
                        textAnchor: rotateLabels ? 'end' : 'middle',
                        angle: rotateLabels ? -45 : 0,
                        dx: rotateLabels ? '-0.25em' : '0',
                        dy: rotateLabels ? '0.25em' : '0.33em',
                    })}
                />
                <BarGroup
                    padding={GROUP_PADDING}
                    onPointerMove={handlePointerMove}
                    onPointerOut={() => setHovered(null)}
                >
                    {series.map((seriesItem, seriesIndex) => (
                        <BarSeries
                            key={seriesItem.name}
                            dataKey={seriesItem.name}
                            data={seriesItem.points}
                            xAccessor={point => point.label}
                            yAccessor={point => point.value}
                            colorAccessor={() => getSeriesColor(color, seriesIndex)}
                            radius={4}
                            radiusTop
                        />
                    ))}
                </BarGroup>
                <ValueLabels series={series} valueFormat={valueFormat} />
                <GroupedBarLabels series={series} />
            </XYChart>
            <BarChartTooltip hovered={hovered} series={series} width={width} />
        </div>
    );
};

type BarChartGroupedProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    color?: string;
};

export const BarChartGrouped = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
    color = DEFAULT_CHART_COLOR,
}: BarChartGroupedProps) => (
    <ParentSize style={{ height: CHART_HEIGHT }}>
        {({ width }) =>
            width >= MIN_CHART_WIDTH ? (
                <BarChartGroupedInner
                    series={series}
                    labels={labels}
                    labelTimeGranularity={labelTimeGranularity}
                    valueFormat={valueFormat}
                    color={color}
                    width={width}
                    height={CHART_HEIGHT}
                />
            ) : width > 0 ? (
                <div style={{ height: CHART_HEIGHT }} />
            ) : null
        }
    </ParentSize>
);
