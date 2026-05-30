import type { metricFormats } from './const.js';

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

export type DashboardMetricItem = DashboardBaseItem & {
    kind: 'metric';
    datasetId: string;
    name: string;
    expression: string;
    format: MetricFormat;
    value?: number | null;
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

export type ReorderDashboardItemsPayload = {
    order: Array<{ itemId: string; posY: number }>;
};

export type Dashboard = DashboardResponse;
