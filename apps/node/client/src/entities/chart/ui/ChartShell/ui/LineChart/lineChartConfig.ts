import { buildChartTheme } from '@visx/xychart';

import { buildChartPalette, DEFAULT_CHART_COLOR } from '../../../../lib';
import type { ChartSeries } from '../../../../lib/parseChartData';

export const C = {
    muted: '#b0b0b0',
    outline: '#2c2a2b',
    surface: '#1a1a1a',
    surfaceHigh: '#242424',
    onSurface: '#fff',
    positive: '#58c4a7',
    negative: '#c85080',
} as const;

export const CHART_HEIGHT = 360;
export const GLYPH_SERIES_SUFFIX = ':glyphs';
export const SERIES_COLORS = [
    DEFAULT_CHART_COLOR,
    '#c85080',
    '#4a8f8f',
    '#d09a3a',
    '#7c6bc4',
    '#78a95a',
];

export const chartTheme = buildChartTheme({
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

export const getValues = (series: ChartSeries[]) =>
    series.flatMap(item => item.points.map(point => point.value)).filter(Number.isFinite);

export const getSeriesColor = (baseColor: string, seriesIndex: number) =>
    buildChartPalette(baseColor, Math.max(seriesIndex + 1, SERIES_COLORS.length))[
        seriesIndex
    ];

export const gradientId = (seriesName: string, seriesIndex: number) =>
    `line-area-grad-${seriesIndex}-${seriesName.replace(/[^a-z0-9_-]/gi, '_')}`;

export const stripGlyphSeriesSuffix = (key: string) =>
    key.endsWith(GLYPH_SERIES_SUFFIX) ? key.slice(0, -GLYPH_SERIES_SUFFIX.length) : key;
