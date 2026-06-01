export const HEATMAP_COLORS = {
    lowValueTone: '#ffffff',
    highValueTone: '#000000',
    muted: '#b0b0b0',
    outline: '#2c2a2b',
    surfaceHigh: '#242424',
    onSurface: '#fff',
} as const;

export const HEATMAP_GAP = 4;
export const HEATMAP_MARGIN = { top: 16, right: 16, bottom: 132, left: 148 };
export const HEATMAP_COMPACT_MARGIN = { top: 8, right: 8, bottom: 16, left: 16 };
export const HEATMAP_DEFAULT_CELL_SIZE = 48;
export const HEATMAP_MAX_CELL_SIZE = 72;

export type HeatmapMargin = typeof HEATMAP_MARGIN;
