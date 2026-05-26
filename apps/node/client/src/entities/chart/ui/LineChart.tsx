import { curveMonotoneX } from '@visx/curve';
import { ParentSize } from '@visx/responsive';
import {
    Axis,
    buildChartTheme,
    GlyphSeries,
    LineSeries,
    Tooltip,
    XYChart,
} from '@visx/xychart';

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

type LineChartInnerProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    width: number;
    height: number;
};

type LineTooltipDatum = ChartDataPoint;

const getValues = (series: ChartSeries[]) =>
    series.flatMap(item => item.points.map(point => point.value)).filter(Number.isFinite);

const getSeriesColor = (seriesIndex: number) =>
    SERIES_COLORS[seriesIndex % SERIES_COLORS.length];

const LineChartInner = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
    width,
    height,
}: LineChartInnerProps) => {
    const rotateLabels = labels.length > 6;
    const values = getValues(series);
    const minValue = values.length ? Math.min(...values, 0) : 0;
    const maxValue = values.length ? Math.max(...values, 1) : 1;
    const margin = { top: 16, right: 16, bottom: rotateLabels ? 96 : 48, left: 64 };

    return (
        <div data-testid="line-chart-svg">
            <XYChart
                accessibilityLabel="Line chart"
                width={width}
                height={height}
                margin={margin}
                theme={chartTheme}
                xScale={{ type: 'point', domain: labels, padding: 0.1 }}
                yScale={{
                    type: 'linear',
                    domain: [Math.min(0, minValue), maxValue],
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
                {series.map((seriesItem, seriesIndex) => {
                    const color = getSeriesColor(seriesIndex);

                    return (
                        <g key={seriesItem.name}>
                            <LineSeries
                                dataKey={seriesItem.name}
                                data={seriesItem.points}
                                xAccessor={point => point.label}
                                yAccessor={point => point.value}
                                strokeWidth={2}
                                curve={curveMonotoneX}
                                colorAccessor={() => color}
                            />
                            <GlyphSeries
                                dataKey={`${seriesItem.name}:glyphs`}
                                data={seriesItem.points}
                                xAccessor={point => point.label}
                                yAccessor={point => point.value}
                                colorAccessor={() => color}
                                renderGlyph={({ key, x, y, color: glyphColor }) => (
                                    <circle
                                        key={key}
                                        cx={x}
                                        cy={y}
                                        r={4}
                                        fill={glyphColor}
                                        stroke={C.surfaceHigh}
                                        strokeWidth={1.5}
                                        style={{ cursor: 'crosshair' }}
                                    />
                                )}
                            />
                        </g>
                    );
                })}
                <Tooltip<LineTooltipDatum>
                    showDatumGlyph
                    snapTooltipToDatumX
                    style={chartTheme.htmlLabel}
                    renderTooltip={({ tooltipData }) => {
                        const nearest = tooltipData?.nearestDatum;

                        if (!nearest) {
                            return null;
                        }

                        const seriesName = nearest.key.replace(/:glyphs$/, '');

                        return (
                            <>
                                <strong>
                                    {formatChartCell(nearest.datum.label, {
                                        timeGranularity:
                                            nearest.datum.labelTimeGranularity,
                                    })}
                                </strong>
                                {series.length > 1 ? ` / ${seriesName}` : ''}:{' '}
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

type LineChartProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
};

export const LineChart = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
}: LineChartProps) => (
    <ParentSize style={{ height: CHART_HEIGHT }}>
        {({ width }) =>
            width >= MIN_CHART_WIDTH ? (
                <LineChartInner
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
