import { buildChartTheme } from '@visx/xychart';

import { buildMonochromeChartPalette, DEFAULT_CHART_COLOR } from '../../../../lib';
import { formatChartCell } from '../../../../lib/formatChartCell';
import type { ChartDataPoint, ChartSeries } from '../../../../lib/parseChartData';

export const C = {
    muted: '#b0b0b0',
    grid: 'rgba(255, 255, 255, 0.04)',
    outline: '#2c2a2b',
    baseline: '#5b5759',
    surface: '#1a1a1a',
    surfaceHigh: '#242424',
    onSurface: '#fff',
    positive: '#58c4a7',
    negative: '#c85080',
} as const;

export const CHART_HEIGHT = 360;
export const MIN_CHART_WIDTH = 180;
export const SERIES_COLORS = [
    DEFAULT_CHART_COLOR,
    '#c85080',
    '#4a8f8f',
    '#d09a3a',
    '#7c6bc4',
    '#78a95a',
];
export const GROUP_PADDING = 0.12;
export const MIN_VALUE_LABEL_W = 32;
export const MAX_VALUE_LABEL_BARS = 12;
export const MAX_LABEL_CHARS = 18;
const AXIS_LABEL_CHAR_WIDTH = 8;
const AXIS_LABEL_WIDTH_RATIO = 0.5;

export const truncate = (s: string, max = MAX_LABEL_CHARS) =>
    s.length > max ? `${s.slice(0, max - 1)}…` : s;

export const formatBarAxisLabel = (
    value: unknown,
    rotate: boolean,
    timeGranularity?: ChartDataPoint['labelTimeGranularity']
) =>
    truncate(
        formatChartCell(value, { timeGranularity }),
        rotate ? MAX_LABEL_CHARS : MAX_LABEL_CHARS + 8
    );

export const getValues = (series: ChartSeries[]) =>
    series.flatMap(item => item.points.map(point => point.value)).filter(Number.isFinite);

export const getAverageValue = (values: number[]) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

export const getMedianValue = (values: number[]) => {
    if (!values.length) {
        return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export const getSeriesColor = (baseColor: string, seriesIndex: number) =>
    buildMonochromeChartPalette(
        baseColor,
        Math.max(seriesIndex + 1, SERIES_COLORS.length)
    )[seriesIndex];

export type BarFillVariant = 'normal' | 'dim' | 'max' | 'min';

export const chartTheme = buildChartTheme({
    backgroundColor: C.surface,
    colors: SERIES_COLORS,
    gridColor: C.grid,
    gridColorDark: C.grid,
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
    xAxisLineStyles: { stroke: C.baseline, strokeWidth: 1.5 },
    yAxisLineStyles: { stroke: C.outline },
    xTickLineStyles: { stroke: C.outline },
    yTickLineStyles: { stroke: C.outline },
});

export const shouldRotateBarAxisLabels = (
    labels: string[],
    width: number,
    timeGranularity?: ChartDataPoint['labelTimeGranularity']
) => {
    if (labels.length > 6) {
        return true;
    }

    if (labels.length <= 1 || width <= 0) {
        return false;
    }

    const availableWidth = Math.max(width - 80, MIN_CHART_WIDTH) / labels.length;
    const longestLabel = labels.reduce((max, label) => {
        const formatted = formatChartCell(label, { timeGranularity });

        return Math.max(max, formatted.length);
    }, 0);

    return longestLabel * AXIS_LABEL_CHAR_WIDTH > availableWidth * AXIS_LABEL_WIDTH_RATIO;
};
