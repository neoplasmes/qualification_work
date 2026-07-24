import { buildChartTheme } from '@visx/xychart';

import { buildChartPalette, defaultChartColor } from '../../lib';
import type { ChartSeries } from '../../lib/parseChartData';

export const chartColors = {
    muted: '#66635f',
    outline: '#a8a7a1',
    surface: '#f7f6f3',
    surfaceHigh: '#fdfcfa',
    onSurface: '#1a1614',
    positive: '#a89a1a',
    negative: '#de4e1a',
} as const;

export const chartHeight = 360;
export const glyphSeriesSuffix = ':glyphs';
export const seriesColors = [
    defaultChartColor,
    '#de4e1a',
    '#4a8f8f',
    '#d09a3a',
    '#7c6bc4',
    '#78a95a',
];

export const chartTheme = buildChartTheme({
    backgroundColor: chartColors.surface,
    colors: seriesColors,
    gridColor: chartColors.outline,
    gridColorDark: chartColors.outline,
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
    xAxisLineStyles: { stroke: chartColors.outline },
    yAxisLineStyles: { stroke: chartColors.outline },
    xTickLineStyles: { stroke: chartColors.outline },
    yTickLineStyles: { stroke: chartColors.outline },
});

export const getValues = (series: ChartSeries[]) =>
    series.flatMap(item => item.points.map(point => point.value)).filter(Number.isFinite);

export const getSeriesColor = (baseColor: string, seriesIndex: number) =>
    buildChartPalette(baseColor, Math.max(seriesIndex + 1, seriesColors.length))[
        seriesIndex
    ];

// scope keeps gradient ids unique per chart instance so area fills on a
// dashboard with many line charts do not reference each other's gradients
export const gradientId = (scope: string, seriesName: string, seriesIndex: number) =>
    `line-area-grad-${scope}-${seriesIndex}-${seriesName.replace(/[^a-z0-9_-]/gi, '_')}`;

export const stripGlyphSeriesSuffix = (key: string) =>
    key.endsWith(glyphSeriesSuffix) ? key.slice(0, -glyphSeriesSuffix.length) : key;
