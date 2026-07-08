import {
    HEATMAP_DEFAULT_CELL_SIZE,
    HEATMAP_GAP,
    HEATMAP_MARGIN,
    type HeatmapMargin,
} from './heatmapChartConfig';

const heatmapCompactMargin: HeatmapMargin = { top: 4, right: 4, bottom: 4, left: 4 };
const heatmapMinCellSize = 6;
const heatmapMaxCellSize = 112;
const heatmapLabelsMinCellSize = 14;
const heatmapMinGap = 1;
const heatmapAxisLabelMinFontSize = 10;
const heatmapAxisLabelMaxFontSize = 14;
const heatmapAxisLabelCharRatio = 0.58;
const heatmapRotatedAxisLabelCharRatio = 0.48;

export type HeatmapLayout = {
    margin: HeatmapMargin;
    cellSize: number;
    gap: number;
    axisFontSize: number;
    xAxisLabelMaxChars: number;
    yAxisLabelMaxChars: number;
    showAxisTickLabels: boolean;
};

const getHeatmapHeight = (
    rowsCount: number,
    cellSize: number,
    margin: HeatmapMargin,
    gap: number
) => margin.top + margin.bottom + rowsCount * cellSize + Math.max(0, rowsCount - 1) * gap;

const getLongestLabelLength = (values: string[]) =>
    values.reduce((max, value) => Math.max(max, value.length), 0);

const getHeatmapAxisFontSize = (width: number, height: number) =>
    Math.max(
        heatmapAxisLabelMinFontSize,
        Math.min(heatmapAxisLabelMaxFontSize, Math.floor(Math.min(width, height) / 28))
    );

const getCappedMarginSize = (value: number, min: number, max: number) => {
    const resolvedMax = Math.max(min, max);

    return Math.round(Math.max(min, Math.min(value, resolvedMax)));
};

const getLabeledHeatmapMargin = (
    width: number,
    height: number,
    xValues: string[],
    yValues: string[],
    axisFontSize: number
): HeatmapMargin => {
    const xLabelHeight =
        getLongestLabelLength(xValues) * axisFontSize * heatmapRotatedAxisLabelCharRatio +
        28;
    const yLabelWidth =
        getLongestLabelLength(yValues) * axisFontSize * heatmapAxisLabelCharRatio + 18;

    return {
        top: Math.max(8, Math.round(axisFontSize * 0.75)),
        right: 12,
        bottom: getCappedMarginSize(xLabelHeight, 44, height * 0.28),
        left: getCappedMarginSize(yLabelWidth, 64, width * 0.3),
    };
};

const getAxisLabelMaxChars = (
    availableSize: number,
    axisFontSize: number,
    charRatio: number
) =>
    Math.max(4, Math.floor(Math.max(0, availableSize - 16) / (axisFontSize * charRatio)));

const getHeatmapCellSize = (
    width: number,
    columnsCount: number,
    height: number,
    rowsCount: number,
    margin: HeatmapMargin,
    gap: number
) => {
    if (columnsCount === 0 || rowsCount === 0) {
        return HEATMAP_DEFAULT_CELL_SIZE;
    }

    const xMax = Math.max(0, width - margin.left - margin.right);
    const yMax = Math.max(0, height - margin.top - margin.bottom);
    const widthSize = Math.floor(
        (xMax - Math.max(0, columnsCount - 1) * gap) / columnsCount
    );
    const heightSize = Math.floor((yMax - Math.max(0, rowsCount - 1) * gap) / rowsCount);

    return Math.max(
        heatmapMinCellSize,
        Math.min(heatmapMaxCellSize, widthSize, heightSize)
    );
};

const getHeatmapGap = (cellSize: number) =>
    Math.max(heatmapMinGap, Math.min(HEATMAP_GAP, Math.floor(cellSize * 0.14)));

const getHeatmapTilesLayout = (
    width: number,
    columnsCount: number,
    height: number,
    rowsCount: number,
    margin: HeatmapMargin
) => {
    const initialCellSize = getHeatmapCellSize(
        width,
        columnsCount,
        height,
        rowsCount,
        margin,
        HEATMAP_GAP
    );
    const gap = getHeatmapGap(initialCellSize);
    const cellSize = getHeatmapCellSize(
        width,
        columnsCount,
        height,
        rowsCount,
        margin,
        gap
    );

    return { cellSize, gap };
};

const getCompactHeatmapLayout = (
    width: number,
    columnsCount: number,
    height: number,
    rowsCount: number,
    axisFontSize: number
): HeatmapLayout => {
    const { cellSize, gap } = getHeatmapTilesLayout(
        width,
        columnsCount,
        height,
        rowsCount,
        heatmapCompactMargin
    );

    return {
        margin: heatmapCompactMargin,
        cellSize,
        gap,
        axisFontSize,
        xAxisLabelMaxChars: 0,
        yAxisLabelMaxChars: 0,
        showAxisTickLabels: false,
    };
};

export const getHeatmapBaseHeight = (rowsCount: number, showAxisTickLabels: boolean) => {
    const margin = showAxisTickLabels ? HEATMAP_MARGIN : heatmapCompactMargin;

    return getHeatmapHeight(rowsCount, HEATMAP_DEFAULT_CELL_SIZE, margin, HEATMAP_GAP);
};

export const getHeatmapLayout = ({
    width,
    height,
    xValues,
    yValues,
    showAxisTickLabels,
}: {
    width: number;
    height: number;
    xValues: string[];
    yValues: string[];
    showAxisTickLabels: boolean;
}): HeatmapLayout => {
    const axisFontSize = getHeatmapAxisFontSize(width, height);
    const columnsCount = xValues.length;
    const rowsCount = yValues.length;

    if (!showAxisTickLabels) {
        return getCompactHeatmapLayout(
            width,
            columnsCount,
            height,
            rowsCount,
            axisFontSize
        );
    }

    const margin = getLabeledHeatmapMargin(width, height, xValues, yValues, axisFontSize);
    const { cellSize, gap } = getHeatmapTilesLayout(
        width,
        columnsCount,
        height,
        rowsCount,
        margin
    );

    if (cellSize < heatmapLabelsMinCellSize) {
        return getCompactHeatmapLayout(
            width,
            columnsCount,
            height,
            rowsCount,
            axisFontSize
        );
    }

    return {
        margin,
        cellSize,
        gap,
        axisFontSize,
        xAxisLabelMaxChars: getAxisLabelMaxChars(
            margin.bottom,
            axisFontSize,
            heatmapRotatedAxisLabelCharRatio
        ),
        yAxisLabelMaxChars: getAxisLabelMaxChars(
            margin.left,
            axisFontSize,
            heatmapAxisLabelCharRatio
        ),
        showAxisTickLabels: true,
    };
};
