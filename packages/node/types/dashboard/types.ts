import type {
    metricFormats,
    metricTargetDirections,
    metricTimeBuckets,
} from './const.js';

export type DashboardItemLayout = {
    posX: number;
    posY: number;
    width: number;
    height: number;
};

export type DashboardBaseItem = {
    id: string;
    layout: DashboardItemLayout;
};

export type DashboardChartItem = DashboardBaseItem & {
    kind: 'chart';
    chartId: string;
};

export type MetricFormat = (typeof metricFormats)[number];

export type MetricTimeBucket = (typeof metricTimeBuckets)[number];

export type MetricTargetDirection = (typeof metricTargetDirections)[number];

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

export type DashboardResponse = {
    id: string;
    orgId: string;
    name: string;
    items: DashboardItem[];
    createdAt: string;
    updatedAt: string;
};

export type CreateDashboardPayload = {
    orgId: string;
    name: string;
};

export type CreateDashboardResponse = {
    id: string;
};

export type RenameDashboardPayload = {
    name: string;
};

export type AddDashboardChartPayload = {
    kind: 'chart';
    chartId: string;
    height?: number;
};

export type AddDashboardMetricPayload = {
    kind: 'metric';
    datasetId: string;
    name: string;
    expression: string;
    format: MetricFormat;
    target?: number | null;
    targetDirection?: MetricTargetDirection | null;
    showTrend?: boolean;
    timeColumn?: string | null;
    timeBucket?: MetricTimeBucket | null;
    height?: number;
};

export type AddDashboardItemPayload =
    | AddDashboardChartPayload
    | AddDashboardMetricPayload;

export type AddDashboardItemResponse = {
    itemId: string;
    posY: number;
};

export type UpdateDashboardMetricPayload = Omit<AddDashboardMetricPayload, 'height'>;

export type PreviewDashboardMetricPayload = {
    datasetId: string;
    expression: string;
};

export type PreviewDashboardMetricResponse = {
    value: number | null;
};

export type DashboardItemLayoutInput = {
    itemId: string;
    posX: number;
    posY: number;
    width: number;
    height: number;
};

export type UpdateDashboardLayoutPayload = {
    layout: DashboardItemLayoutInput[];
};

export type Dashboard = DashboardResponse;
