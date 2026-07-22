import {
    CompactSelection,
    type GridSelection,
    type Theme,
} from '@glideapps/glide-data-grid';

export const rowsPageSize = 200;

// empty native grid selection; used as initial state and to reset after bulk actions
export const emptyGridSelection: GridSelection = {
    columns: CompactSelection.empty(),
    rows: CompactSelection.empty(),
    current: undefined,
};
export const headerHeight = 40;
export const rowHeight = 34;
export const maxGridHeight = 520;

// values mirror the canonical paper design-system palette
export const gridTheme: Partial<Theme> = {
    accentColor: '#1a1614',
    accentFg: '#f4f4e7',
    accentLight: '#e2e67d',
    textDark: '#1a1614',
    textMedium: '#53504c',
    textLight: '#66635f',
    textBubble: '#1a1614',
    bgIconHeader: '#f7f6f3',
    fgIconHeader: '#53504c',
    textHeader: '#1a1614',
    textHeaderSelected: '#1a1614',
    bgCell: '#fdfcfa',
    bgCellMedium: '#f7f6f3',
    bgHeader: '#f7f6f3',
    bgHeaderHasFocus: '#e2e67d',
    bgHeaderHovered: '#e2e67d',
    bgBubble: '#f7f6f3',
    bgBubbleSelected: '#e2e67d',
    bgSearchResult: '#e2e67d',
    borderColor: '#e3e3de',
    drilldownBorder: '#a8a7a1',
    linkColor: '#1a1614',
    cellHorizontalPadding: 12,
    cellVerticalPadding: 8,
    headerFontStyle: '11px',
    headerIconSize: 16,
    baseFontStyle: '14px',
    markerFontStyle: '11px',
    fontFamily: '"IBM Plex Mono", monospace',
    editorFontSize: '14px',
    lineHeight: 1.5,
    horizontalBorderColor: '#e3e3de',
    headerBottomBorderColor: '#1a1614',
};
