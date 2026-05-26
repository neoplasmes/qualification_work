import { ParentSize } from '@visx/responsive';
import {
    Axis,
    BarGroup,
    BarSeries,
    buildChartTheme,
    Tooltip,
    XYChart,
} from '@visx/xychart';

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

type BarChartInnerProps = {
    series: ChartSeries[];
    labels: string[];
    width: number;
    height: number;
};

type BarTooltipDatum = ChartDataPoint;

const getValues = (series: ChartSeries[]) =>
    series.flatMap(item => item.points.map(point => point.value)).filter(Number.isFinite);

const BarChartInner = ({ series, labels, width, height }: BarChartInnerProps) => {
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
                    tickFormat={v => formatAxisNumber(Number(v))}
                />
                <Axis
                    orientation="bottom"
                    numTicks={labels.length}
                    tickFormat={v => formatChartCell(v)}
                    tickLabelProps={() => ({
                        fill: C.muted,
                        fontSize: 11,
                        textAnchor: rotateLabels ? 'end' : 'middle',
                        angle: rotateLabels ? -45 : 0,
                        dx: rotateLabels ? '-0.25em' : '0',
                        dy: rotateLabels ? '0.25em' : '0.33em',
                    })}
                />
                <BarGroup padding={0.12}>
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
                <Tooltip<BarTooltipDatum>
                    showVerticalCrosshair
                    snapTooltipToDatumX
                    style={chartTheme.htmlLabel}
                    renderTooltip={({ tooltipData }) => {
                        const nearest = tooltipData?.nearestDatum;

                        if (!nearest) {
                            return null;
                        }

                        return (
                            <>
                                <strong>{formatChartCell(nearest.datum.label)}</strong>
                                {series.length > 1 ? ` / ${nearest.key}` : ''}:{' '}
                                {formatChartCell(nearest.datum.value)}
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
};

export const BarChart = ({ series, labels }: BarChartProps) => (
    <ParentSize style={{ height: CHART_HEIGHT }}>
        {({ width }) =>
            width >= MIN_CHART_WIDTH ? (
                <BarChartInner
                    series={series}
                    labels={labels}
                    width={width}
                    height={CHART_HEIGHT}
                />
            ) : width > 0 ? (
                <div style={{ height: CHART_HEIGHT }} />
            ) : null
        }
    </ParentSize>
);
