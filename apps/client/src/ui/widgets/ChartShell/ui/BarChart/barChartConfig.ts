import { buildChartTheme } from '@visx/xychart';

import { buildMonochromeChartPalette, defaultChartColor } from '../../lib';
import { formatChartCell } from '../../lib/formatChartCell';
import type { ChartDataPoint, ChartSeries } from '../../lib/parseChartData';

export const chartColors = {
    muted: '#66635f',
    grid: '#e3e3de',
    outline: '#a8a7a1',
    baseline: '#a8a7a1',
    surface: '#f7f6f3',
    surfaceHigh: '#fdfcfa',
    onSurface: '#1a1614',
    positive: '#a89a1a',
    negative: '#de4e1a',
} as const;

export const chartHeight = 360;
export const minChartWidth = 180;
export const seriesColors = [
    defaultChartColor,
    '#de4e1a',
    '#4a8f8f',
    '#d09a3a',
    '#7c6bc4',
    '#78a95a',
];
export const groupPadding = 0.12;
export const minValueLabelW = 32;
export const maxValueLabelBars = 12;
export const maxLabelChars = 18;
const axisLabelCharWidth = 8;
const axisLabelWidthRatio = 0.5;
const rotatedLabelCharWidth = 7;
const rotatedLabelVerticalRatio = 0.7;
const rotatedLabelVerticalPadding = 18;
const minGroupedBarPlotHeight = 112;

export const truncate = (s: string, max = maxLabelChars) =>
    s.length > max ? `${s.slice(0, max - 1)}…` : s;

export const formatBarAxisLabel = (
    value: unknown,
    rotate: boolean,
    timeGranularity?: ChartDataPoint['labelTimeGranularity']
) =>
    truncate(
        formatChartCell(value, { timeGranularity }),
        rotate ? maxLabelChars : maxLabelChars + 8
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
        Math.max(seriesIndex + 1, seriesColors.length)
    )[seriesIndex];

export type BarFillVariant = 'normal' | 'dim' | 'max' | 'min';

export const chartTheme = buildChartTheme({
    backgroundColor: chartColors.surface,
    colors: seriesColors,
    gridColor: chartColors.grid,
    gridColorDark: chartColors.grid,
    tickLength: 8,
    svgLabelSmall: {
        fontFamily: 'IBM Plex Mono, monospace',
        fill: chartColors.muted,
        fontSize: 14,
    },
    htmlLabel: {
        background: chartColors.surfaceHigh,
        color: chartColors.onSurface,
        border: `1px solid ${chartColors.outline}`,
        fontSize: 14,
    },
    xAxisLineStyles: { stroke: chartColors.baseline, strokeWidth: 1.5 },
    yAxisLineStyles: { stroke: chartColors.outline },
    xTickLineStyles: { stroke: chartColors.outline },
    yTickLineStyles: { stroke: chartColors.outline },
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

    const availableWidth = Math.max(width - 80, minChartWidth) / labels.length;
    const longestLabel = labels.reduce((max, label) => {
        const formatted = formatChartCell(label, { timeGranularity });

        return Math.max(max, formatted.length);
    }, 0);

    return longestLabel * axisLabelCharWidth > availableWidth * axisLabelWidthRatio;
};

export const shouldHideGroupedBarXAxisLabels = (
    labels: string[],
    width: number,
    height: number,
    bottomMargin: number,
    timeGranularity?: ChartDataPoint['labelTimeGranularity']
) => {
    const rotateLabels = shouldRotateBarAxisLabels(labels, width, timeGranularity);
    if (!rotateLabels || height <= 0) {
        return false;
    }

    const longestVisibleLabel = labels.reduce((max, label) => {
        const formatted = formatBarAxisLabel(label, true, timeGranularity);

        return Math.max(max, formatted.length);
    }, 0);
    const requiredLabelHeight = Math.ceil(
        longestVisibleLabel * rotatedLabelCharWidth * rotatedLabelVerticalRatio +
            rotatedLabelVerticalPadding
    );
    const availablePlotHeight = height - bottomMargin;

    return (
        requiredLabelHeight > bottomMargin ||
        availablePlotHeight < minGroupedBarPlotHeight
    );
};
