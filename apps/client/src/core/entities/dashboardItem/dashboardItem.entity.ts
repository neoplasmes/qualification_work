export type MetricTimeBucket = 'day' | 'week' | 'month';
export type MetricTargetDirection = 'higher' | 'lower';

export type DashboardItemLayout = {
    posX: number;
    posY: number;
    width: number;
    height: number;
};

export type DashboardBaseItem = {
    readonly ref: `dashboardItem:${string}`;
    id: string;
    layout: DashboardItemLayout;
};

export type DashboardChartItem = DashboardBaseItem & {
    kind: 'chart';
    chartId: string;
};

export type MetricFormat = string;

/**
 * single computed point of a metric trend series
 */
export type MetricTrendPoint = {
    bucket: string;
    value: number | null;
};

export type DashboardMetricItem = DashboardBaseItem & {
    kind: 'metric';
    datasetId: string;
    name: string;
    expression: string;
    format: MetricFormat;
    valueMultiplier: number;
    // goal: drives value color and the progress bar, null = no target
    target: number | null;
    // which direction counts as good relative to the target
    targetDirection: MetricTargetDirection | null;
    // trend configuration
    showTrend: boolean;
    // null = auto-detect the first date column
    timeColumn: string | null;
    // null = auto-detect bucket size
    timeBucket: MetricTimeBucket | null;
    // computed at read time
    value?: number | null;
    trend?: MetricTrendPoint[] | null;
};

export type DashboardItemKind = DashboardMetricItem['kind'] | DashboardChartItem['kind'];

export type DashboardItem = DashboardChartItem | DashboardMetricItem;
