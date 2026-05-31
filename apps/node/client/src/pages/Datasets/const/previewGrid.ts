import {
    CompactSelection,
    type GridSelection,
    type Theme,
} from '@glideapps/glide-data-grid';

export const ROWS_PAGE_SIZE = 200;

// empty native grid selection; used as initial state and to reset after bulk actions
export const EMPTY_GRID_SELECTION: GridSelection = {
    columns: CompactSelection.empty(),
    rows: CompactSelection.empty(),
    current: undefined,
};
export const HEADER_H = 40;
export const ROW_H = 34;
export const MAX_GRID_H = 520;

// values mirror shared/ui/styles/colors.scss (brand #910e2f = rgb(145,14,47))
export const GRID_THEME: Partial<Theme> = {
    accentColor: '#910e2f',
    accentFg: '#ffffff',
    accentLight: 'rgba(145,14,47,0.14)',
    textDark: '#ffffff',
    textMedium: '#b0b0b0',
    textLight: '#8c8c8c',
    textBubble: '#ffffff',
    bgIconHeader: '#1a1a1a',
    fgIconHeader: '#b0b0b0',
    textHeader: '#ffffff',
    textHeaderSelected: '#ffffff',
    bgCell: '#111111',
    bgCellMedium: 'rgba(255,255,255,0.025)',
    bgHeader: '#1a1a1a',
    bgHeaderHasFocus: '#242424',
    bgHeaderHovered: '#242424',
    bgBubble: '#1a1a1a',
    bgBubbleSelected: '#242424',
    bgSearchResult: 'rgba(145,14,47,0.22)',
    borderColor: '#2c2a2b',
    drilldownBorder: '#2c2a2b',
    linkColor: '#910e2f',
    cellHorizontalPadding: 12,
    cellVerticalPadding: 8,
    headerFontStyle: 'bold 11px',
    headerIconSize: 16,
    baseFontStyle: '13px',
    markerFontStyle: '11px',
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    editorFontSize: '13px',
    lineHeight: 1.4,
    horizontalBorderColor: '#2c2a2b',
    headerBottomBorderColor: '#2c2a2b',
};
