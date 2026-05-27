export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export type AxisGrouping =
    | {
          kind: 'time';
          /**
           * How to aggregate the time series values
           */
          granularity: TimeGranularity;
      }
    | {
          kind: 'numeric';
          /**
           * how to aggregate numeric values
           *
           * @example
           * ```
           * step = 1000
           *
           * 300 ——
           * 400   | ——> will be counted as 3 of something
           * 700 ——
           * ```
           */
          step: number;
      }
    | null;

/**
 * Aggregation function types
 */
// prettier-ignore
export type Aggregate =
    | 'sum'             // SUM(column)
    | 'avg'             // AVG(column)
    | 'min'             // MIN(column)
    | 'max'             // MAX(column)
    | 'count'           // COUNT(*)
    | 'count_distinct'; // COUNT(DISTINCT column)

export type MeasureValueFormat = 'number' | 'rub' | 'usd' | 'percent';

/**
 * A single aggregated value displayed on the chart
 */
export type Measure = {
    /**
     * Column to aggregate
     */
    columnId?: string;
    aggregate: Aggregate;
    /**
     * optional label for this measure to display
     */
    alias?: string;
    /**
     * display format for this measure
     */
    valueFormat?: MeasureValueFormat;
};

/**
 * filter comparison operation types
 *
 * Binary operators (eq, neq, gt, gte, lt, lte) expects a numeric value
 * in/nin expect an array value
 * between expects a [min, max]
 * is_null/not_null value-agnostic
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
 * a single WHERE condition, applied before aggregation
 */
export type FilterClause = {
    columnId: string;
    op: FilterOperation;
    /**
     * 'any' actually
     */
    value?: unknown;
};

export type OrderBy = {
    ref: 'dim' | 'measure';
    index?: number;
    dir: 'asc' | 'desc';
};

export type ChartType = 'bar' | 'line' | 'pie' | 'heatmap';

export type BaseChartConfig = {
    /**
     * Visual-only chart style. It does not affect SQL compilation.
     */
    style?: {
        color?: string;
    };
    /**
     * WHERE filter clause
     */
    filters?: FilterClause[];
    /**
     * Max rows returned
     */
    limit?: number;
    orderBy?: OrderBy;
};

/**
 * Bar chart config
 */
export type BarChartConfig = BaseChartConfig & {
    kind: 'bar';
    dimension: { columnId: string; grouping?: AxisGrouping };
    series?: { columnId: string; topN?: number; otherBucket?: boolean };
    measures: Measure[];
};

/**
 * Line chart config
 */
export type LineChartConfig = BaseChartConfig & {
    kind: 'line';
    dimension: { columnId: string; grouping?: AxisGrouping };
    series?: { columnId: string; topN?: number };
    measures: Measure[];
};

/**
 * Pie chart config
 */
export type PieChartConfig = BaseChartConfig & {
    kind: 'pie';
    slice: { columnId: string; topN?: number; otherBucket?: boolean };
    measure: Measure;
};

/**
 * heatmap config
 */
export type HeatmapChartConfig = BaseChartConfig & {
    kind: 'heatmap';
    x: { columnId: string; grouping?: AxisGrouping };
    y: { columnId: string; grouping?: AxisGrouping };
    measure: Measure;
};

export type ChartConfig =
    | BarChartConfig
    | LineChartConfig
    | PieChartConfig
    | HeatmapChartConfig;

export type ChartResultColumn = {
    name: string;
    role: 'dim' | 'series' | 'measure';
    type: 'number' | 'string' | 'date' | 'day_of_week';
    timeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
};

/**
 * a single result row
 */
export type ChartResultRow = Array<string | number | null>;

/**
 * server response for a chart data request
 */
export type ChartResponse = {
    kind: ChartType;
    columns: ChartResultColumn[];
    rows: ChartResultRow[];
    /**
     * True when the result was cut at the configured limit
     */
    truncated: boolean;
    /**
     * timestamp of when the aggregation query happened
     */
    aggregatedAt: string;
};
