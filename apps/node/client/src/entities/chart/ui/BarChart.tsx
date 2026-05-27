import { ParentSize } from '@visx/responsive';
import { scaleBand } from '@visx/scale';
import {
    Axis,
    BarGroup,
    BarSeries,
    buildChartTheme,
    DataContext,
    Tooltip,
    XYChart,
} from '@visx/xychart';
import { useContext } from 'react';

import type { MeasureValueFormat, TimeGranularity } from '../api';
import { formatAxisNumber, formatChartCell } from '../lib/formatChartCell';
import type { ChartDataPoint, ChartSeries } from '../lib/parseChartData';

const C = {
    muted: '#b0b0b0',
    outline: '#2c2a2b',
    surface: '#1a1a1a',
    surfaceHigh: '#242424',
    onSurface: '#fff',
} as const;

const CHART_HEIGHT = 360;
const MIN_CHART_WIDTH = 180;
const SERIES_COLORS = ['#872557', '#c85080', '#4a8f8f', '#d09a3a', '#7c6bc4', '#78a95a'];
// inner band padding for grouped bars (must match BarGroup `padding` below)
const GROUP_PADDING = 0.12;
// thresholds to hide labels when bars are too small
const MIN_BAR_W_FOR_LABEL = 12;
const MIN_BAR_H_FOR_LABEL = 56;
const MAX_LABEL_CHARS = 18;

const truncate = (s: string, max = MAX_LABEL_CHARS) =>
    s.length > max ? `${s.slice(0, max - 1)}…` : s;

const chartTheme = buildChartTheme({
    backgroundColor: C.surface,
    colors: SERIES_COLORS,
    gridColor: C.outline,
    gridColorDark: C.outline,
    tickLength: 8,
    svgLabelSmall: {
        fill: C.muted,
        fontSize: 11,
    },
    htmlLabel: {
        background: C.surfaceHigh,
        color: C.onSurface,
        border: `1px solid ${C.outline}`,
        fontSize: 12,
    },
    xAxisLineStyles: { stroke: C.outline },
    yAxisLineStyles: { stroke: C.outline },
    xTickLineStyles: { stroke: C.outline },
    yTickLineStyles: { stroke: C.outline },
});

type BarChartInnerProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    width: number;
    height: number;
};

type BarTooltipDatum = ChartDataPoint;

// renders the breakdown series name vertically inside each grouped bar
const GroupedBarLabels = ({ series }: { series: ChartSeries[] }) => {
    const { xScale, yScale } = useContext(DataContext);
    if (!xScale || !yScale) {
        return null;
    }

    const bandwidth =
        typeof (xScale as { bandwidth?: () => number }).bandwidth === 'function'
            ? (xScale as { bandwidth: () => number }).bandwidth()
            : 0;
    if (bandwidth <= 0) {
        return null;
    }

    const innerScale = scaleBand<string>({
        domain: series.map(s => s.name),
        range: [0, bandwidth],
        padding: GROUP_PADDING,
    });
    const barWidth = innerScale.bandwidth();
    if (barWidth < MIN_BAR_W_FOR_LABEL) {
        return null;
    }

    // xScale is a band over string labels, yScale is linear over numbers; visx
    // types union them with date/numeric scales, so cast at the call site
    const xBand = xScale as unknown as (value: string) => number | undefined;
    const yLinear = yScale as unknown as (value: number) => number | undefined;
    const zeroY = Number(yLinear(0));

    return (
        <g pointerEvents="none">
            {series.flatMap(s =>
                s.points.map(p => {
                    if (!Number.isFinite(p.value)) {
                        return null;
                    }

                    const x0 = xBand(p.label);
                    const x1 = innerScale(s.name);
                    const yV = yLinear(p.value);
                    if (x0 == null || x1 == null || yV == null) {
                        return null;
                    }

                    const yTop = Math.min(yV, zeroY);
                    const yBottom = Math.max(yV, zeroY);
                    const barH = yBottom - yTop;
                    if (barH < MIN_BAR_H_FOR_LABEL) {
                        return null;
                    }

                    // anchor near bar bottom; rotate -90 so text reads bottom -> top
                    const cx = x0 + x1 + barWidth / 2;
                    const ay = yBottom - 8;

                    return (
                        <text
                            key={`${p.label}-${s.name}`}
                            x={cx}
                            y={ay}
                            transform={`rotate(-90, ${cx}, ${ay})`}
                            textAnchor="start"
                            dominantBaseline="central"
                            fontSize={11}
                            fontWeight={600}
                            fill={C.onSurface}
                            style={{
                                paintOrder: 'stroke',
                                stroke: 'rgba(0, 0, 0, 0.6)',
                                strokeWidth: 3,
                                strokeLinejoin: 'round',
                            }}
                        >
                            {truncate(s.name)}
                        </text>
                    );
                })
            )}
        </g>
    );
};

const getValues = (series: ChartSeries[]) =>
    series.flatMap(item => item.points.map(point => point.value)).filter(Number.isFinite);

const BarChartInner = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
    width,
    height,
}: BarChartInnerProps) => {
    const rotateLabels = labels.length > 6;
    const values = getValues(series);
    const minValue = values.length ? Math.min(...values, 0) : 0;
    const maxValue = values.length ? Math.max(...values, 1) : 1;
    const margin = {
        top: 16,
        right: 16,
        bottom: rotateLabels ? 96 : 48,
        left: 64,
    };

    return (
        <div data-testid="bar-chart-svg">
            <XYChart
                accessibilityLabel="Bar chart"
                width={width}
                height={height}
                margin={margin}
                theme={chartTheme}
                xScale={{ type: 'band', domain: labels, padding: 0.3 }}
                yScale={{
                    type: 'linear',
                    domain: [minValue, maxValue],
                    nice: true,
                    zero: true,
                }}
            >
                <Axis
                    orientation="left"
                    numTicks={5}
                    tickFormat={v => formatAxisNumber(Number(v), valueFormat)}
                />
                <Axis
                    orientation="bottom"
                    numTicks={labels.length}
                    tickFormat={v =>
                        formatChartCell(v, { timeGranularity: labelTimeGranularity })
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
                <BarGroup padding={GROUP_PADDING}>
                    {series.map(seriesItem => (
                        <BarSeries
                            key={seriesItem.name}
                            dataKey={seriesItem.name}
                            data={seriesItem.points}
                            xAccessor={point => point.label}
                            yAccessor={point => point.value}
                            radius={2}
                            radiusAll
                        />
                    ))}
                </BarGroup>
                {series.length > 1 && <GroupedBarLabels series={series} />}
                <Tooltip<BarTooltipDatum>
                    snapTooltipToDatumX
                    renderTooltip={({ tooltipData }) => {
                        const nearest = tooltipData?.nearestDatum;

                        if (!nearest) {
                            return null;
                        }

                        return (
                            <>
                                <strong>
                                    {formatChartCell(nearest.datum.label, {
                                        timeGranularity:
                                            nearest.datum.labelTimeGranularity,
                                    })}
                                </strong>
                                {series.length > 1 ? ` / ${nearest.key}` : ''}:{' '}
                                {formatChartCell(nearest.datum.value, {
                                    valueFormat: nearest.datum.valueFormat,
                                })}
                            </>
                        );
                    }}
                />
            </XYChart>
        </div>
    );
};

type BarChartProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
};

export const BarChart = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
}: BarChartProps) => (
    <ParentSize style={{ height: CHART_HEIGHT }}>
        {({ width }) =>
            width >= MIN_CHART_WIDTH ? (
                <BarChartInner
                    series={series}
                    labels={labels}
                    labelTimeGranularity={labelTimeGranularity}
                    valueFormat={valueFormat}
                    width={width}
                    height={CHART_HEIGHT}
                />
            ) : width > 0 ? (
                <div style={{ height: CHART_HEIGHT }} />
            ) : null
        }
    </ParentSize>
);
