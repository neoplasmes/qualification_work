import type { DashboardMetricItem } from '@/entities/dashboard';

export type CreateDashboardPayload = {
    orgId: string;
    name: string;
};

export type CreateDashboardResponse = {
    id: string;
};

export type AddDashboardChartPayload = {
    dashboardId: string;
    chartId: string;
    height?: number;
};

export type AddDashboardMetricPayload = {
    dashboardId: string;
    datasetId: string;
    name: string;
    expression: string;
    format: DashboardMetricItem['format'];
    height?: number;
};

export type AddDashboardItemResponse = {
    itemId: string;
    posY: number;
};

export type UpdateDashboardMetricPayload = {
    dashboardId: string;
    itemId: string;
    datasetId: string;
    name: string;
    expression: string;
    format: DashboardMetricItem['format'];
};

export type RenameDashboardPayload = {
    dashboardId: string;
    name: string;
};

export type RemoveDashboardItemPayload = {
    dashboardId: string;
    itemId: string;
};

export type ReorderDashboardItemsPayload = {
    dashboardId: string;
    order: Array<{ itemId: string; posY: number }>;
};
