import type { ColumnDataType } from '../dataset/index.js';
import type {
    aggregates,
    chartResultColumnRoles,
    chartTypes,
    filterOperations,
    measureValueFormats,
    timeGranularities,
} from './const.js';

export type TimeGranularity = (typeof timeGranularities)[number];

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

export type Aggregate = (typeof aggregates)[number];

export type MeasureValueFormat = (typeof measureValueFormats)[number];

export type Measure = {
    columnId?: string;
    aggregate: Aggregate;
    alias?: string;
    valueFormat?: MeasureValueFormat;
};

export type FilterOperation = (typeof filterOperations)[number];

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

export type ChartType = (typeof chartTypes)[number];

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

export type ChartDB = {
    id: string;
    orgId: string;
    datasetId: string;
    name: string;
    chartType: ChartType;
    config: ChartConfig;
    createdAt: Date;
    updatedAt: Date;
};

export type SavedChartResponse = Omit<ChartDB, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
};

export type ChartResultColumnRole = (typeof chartResultColumnRoles)[number];

export type ChartResultColumn = {
    name: string;
    role: ChartResultColumnRole;
    type: Extract<ColumnDataType, 'number' | 'string' | 'date' | 'day_of_week'>;
    timeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
};

export type ChartResultRow = Array<string | number | null>;

export type ChartDataResponse = {
    kind: ChartType;
    columns: ChartResultColumn[];
    rows: ChartResultRow[];
    truncated: boolean;
    aggregatedAt: string;
};

export type CreateChartPayload = {
    orgId: string;
    datasetId: string;
    name: string;
    chartType: ChartType;
    config: ChartConfig;
};

export type CreateChartResponse = {
    id: string;
};

export type UpdateChartPayload = {
    name?: string;
    chartType?: ChartType;
    config?: ChartConfig;
};

export type PatchChartPayload = UpdateChartPayload;

export type PreviewChartPayload = {
    datasetId: string;
    chartType: ChartType;
    config: ChartConfig;
    filterOverrides?: FilterClause[];
};

export type GetChartDataPayload = {
    chartId: string;
    filterOverrides?: FilterClause[];
};

export type Chart = SavedChartResponse;

export type ChartResponse = ChartDataResponse;
