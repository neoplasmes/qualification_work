export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export type AxisGrouping =
    | {
          kind: 'time';
          granularity: TimeGranularity;
      }
    | {
          kind: 'numeric';
          step: number;
      }
    | null;

export type Aggregate = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'count_distinct';

export type Measure = {
    columnId?: string;
    aggregate: Aggregate;
    alias?: string;
    valueFormat?: string;
};

export type FilterOperation =
    | 'eq'
    | 'neq'
    | 'in'
    | 'nin'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'between'
    | 'is_null'
    | 'not_null';

export type FilterClause = {
    columnId: string;
    op: FilterOperation;
    value?: unknown;
};

export type OrderBy = {
    ref: 'dim' | 'measure';
    index?: number;
    dir: 'asc' | 'desc';
};

export type ChartType = 'bar' | 'line' | 'pie' | 'heatmap';

export type BaseChartConfig = {
    style?: {
        color?: string;
    };
    filters?: FilterClause[];
    limit?: number;
    orderBy?: OrderBy;
};

export type BarChartConfig = BaseChartConfig & {
    kind: 'bar';
    dimension: { columnId: string; grouping?: AxisGrouping };
    series?: { columnId: string; topN?: number; otherBucket?: boolean };
    measures: Measure[];
};

export type LineChartConfig = BaseChartConfig & {
    kind: 'line';
    dimension: { columnId: string; grouping?: AxisGrouping };
    series?: { columnId: string; topN?: number };
    measures: Measure[];
};

export type PieChartConfig = BaseChartConfig & {
    kind: 'pie';
    slice: { columnId: string; topN?: number; otherBucket?: boolean };
    measure: Measure;
};

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

export type Chart = {
    readonly ref: `chart:${string}`;
    id: string;
    orgId: string;
    datasetId: string;
    name: string;
    chartType: ChartType;
    config: ChartConfig;
    createdAt: string;
    updatedAt: string;
};

export type ChartResultColumnRole = 'dim' | 'series' | 'measure';

export type ChartResultColumn = {
    name: string;
    role: ChartResultColumnRole;
    type: 'number' | 'string' | 'date' | 'day_of_week';
    timeGranularity?: TimeGranularity;
    valueFormat?: string;
};

export type ChartResultRow = Array<string | number | null>;

export type ChartData = {
    kind: ChartType;
    columns: ChartResultColumn[];
    rows: ChartResultRow[];
    truncated: boolean;
    aggregatedAt: string;
};
