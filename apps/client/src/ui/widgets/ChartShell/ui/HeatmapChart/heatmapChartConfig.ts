export const heatmapColors = {
    lowValueLightness: 0.62,
    highValueLightness: 0.32,
    muted: '#66635f',
    outline: '#a8a7a1',
    surfaceHigh: '#fdfcfa',
    onSurface: '#1a1614',
} as const;

export const heatmapGap = 4;
export const heatmapMargin = { top: 16, right: 16, bottom: 132, left: 148 };
export const heatmapCompactMargin = { top: 8, right: 8, bottom: 16, left: 16 };
export const heatmapDefaultCellSize = 48;
export const heatmapMaxCellSize = 72;

export type HeatmapMargin = typeof heatmapMargin;
