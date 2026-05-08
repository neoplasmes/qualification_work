/**
 * Identifies a dataset column by its key field.
 */
export type ColumnId = string;

/**
 * time granularity for date-based axis binning.
 */
export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * axis bin configuration controls, how raw values are grouped into buckets.
 * null means no binning (use raw values).
 */
export type AxisBin =
    | {
          kind: 'time';
          /**
           * How to truncate the timestamp.
           */
          granularity: TimeGranularity;
      }
    | {
          kind: 'numeric';
          /**
           * Bucket width - values are floored to the nearest multiple of step.
           */
          step: number;
      }
    | null;

/**
 * Aggregation function applied to a measure column.
 * count does not require a columnId - it counts all rows.
 */
// prettier-ignore
export type Aggregate =
    | 'sum'             // SUM(column)
    | 'avg'             // AVG(column)
    | 'min'             // MIN(column)
    | 'max'             // MAX(column)
    | 'count'           // COUNT(*)
    | 'count_distinct'; // COUNT(DISTINCT column)

/**
 * A single aggregated value displayed on the chart.
 * 'alias' overrides the default label shown in the legend/tooltip.
 */
export type Measure = {
    /**
     * Column to aggregate. Required for all aggregates except count.
     */
    columnId?: ColumnId;
    aggregate: Aggregate;
    /**
     * optional display label for this measure.
     */
    alias?: string;
};

/**
 * filter comparison operation types:
 *  Binary operators (eq, neq, gt, etc.) expect a scalar value.
 *  in/nin expect an array value.
 *  between expects a two-element array [min, max].
 *  is_null/not_null ignore value.
 */
// prettier-ignore
export type FilterOperation =
    | 'eq'          // equal
    | 'neq'         // not equal
    | 'in'          // value IN (...)
    | 'nin'         // value NOT IN (...)
    | 'gt'          // greater than
    | 'gte'         // greater than or equal
    | 'lt'          // less than
    | 'lte'         // less than or equal
    | 'between'     // value BETWEEN min AND max
    | 'is_null'     // IS NULL
    | 'not_null'; // IS NOT NULL

/**
 * a single WHERE condition, applied before aggregation.
 * applied to raw column values, before any binning or aggregation.
 */
export type FilterClause = {
    columnId: ColumnId;
    op: FilterOperation;
    /**
     * scalar, array or tuple depending on op. Not required for is_null/not_null.
     */
    value?: unknown;
};

/**
 * sort order for the result set.
 * ref specifies whether to sort by a dimension or a measure.
 * index selects which dimension/measure to use (0-based, defaults to 0).
 */
export type OrderBy = {
    ref: 'dim' | 'measure';
    index?: number;
    dir: 'asc' | 'desc';
};

export type ChartType = 'bar' | 'line' | 'pie' | 'heatmap';

/**
 * Fields shared by all chart config variants.
 */
export type BaseChartConfig = {
    /**
     * Pre-aggregation WHERE filters.
     */
    filters?: FilterClause[];
    /**
     * Max rows returned. Defaults to 1000 on the server.
     */
    limit?: number;
    orderBy?: OrderBy;
};

/**
 * Bar chart config.
 * X axis - categorical or binned dimension.
 * Y axis - one or more numeric measures.
 * Optional series splits bars by a second categorical column.
 */
export type BarChartConfig = BaseChartConfig & {
    kind: 'bar';
    dimension: { columnId: ColumnId; bin?: AxisBin };
    series?: { columnId: ColumnId; topN?: number; otherBucket?: boolean };
    measures: Measure[];
};

/**
 * Line chart config.
 * X axis - usually a time or numeric dimension.
 * Y axis - one or more numeric measures.
 * Optional series renders multiple lines from one column.
 */
export type LineChartConfig = BaseChartConfig & {
    kind: 'line';
    dimension: { columnId: ColumnId; bin?: AxisBin };
    series?: { columnId: ColumnId; topN?: number };
    measures: Measure[];
};

/**
 * Pie (donut) chart config.
 * slice defines the categorical column whose values become wedges.
 * top N limits wedge count; otherBucket merges the rest into an "__other__" slice.
 */
export type PieChartConfig = BaseChartConfig & {
    kind: 'pie';
    slice: { columnId: ColumnId; topN?: number; otherBucket?: boolean };
    measure: Measure;
};

/**
 * heatmap config.
 * 2 dimensions (x, y) with an optional bin each, and one measure for cell intensity.
 */
export type HeatmapChartConfig = BaseChartConfig & {
    kind: 'heatmap';
    x: { columnId: ColumnId; bin?: AxisBin };
    y: { columnId: ColumnId; bin?: AxisBin };
    measure: Measure;
};

export type ChartConfig =
    | BarChartConfig
    | LineChartConfig
    | PieChartConfig
    | HeatmapChartConfig;

/**
 * Metadata for a single column in the chart result.
 * role indicates whether the value is a dimension, series label, or aggregated measure.
 */
export type ChartResultColumn = {
    name: string;
    role: 'dim' | 'series' | 'measure';
    type: 'number' | 'string' | 'date';
};

/**
 * a single result row, where positional values matching ChartResultDTO.columns.
 */
export type ChartResultRow = Array<string | number | null>;

/**
 * server response for a chart data request.
 * Rows are positional arrays for compact transport - use columns to map indices to names/types.
 * truncated is true when the result was cut at limit.
 */
export type ChartResultDTO = {
    kind: ChartType;
    columns: ChartResultColumn[];
    rows: ChartResultRow[];
    /**
     * True when the result was cut at the configured limit.
     */
    truncated: boolean;
    /** timestamp of when the aggregation query ran. */
    aggregatedAt: string;
};
