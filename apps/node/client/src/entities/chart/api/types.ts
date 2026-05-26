export type ChartType = 'bar' | 'line' | 'pie' | 'heatmap';

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

export type Chart = {
    id: string;
    orgId: string;
    datasetId: string;
    name: string;
    chartType: ChartType;
    config: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
};

export type GetChartDataPayload = {
    chartId: string;
    filterOverrides?: FilterClause[];
};

export type ChartResultColumn = {
    name: string;
    role: 'dim' | 'series' | 'measure';
    type: 'number' | 'string' | 'date';
};

export type ChartResponse = {
    kind: ChartType;
    columns: ChartResultColumn[];
    rows: Array<Array<string | number | null>>;
    truncated: boolean;
    aggregatedAt: string;
};
