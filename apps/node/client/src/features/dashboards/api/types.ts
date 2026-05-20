export type DashboardItemLayout = {
    posX: number;
    posY: number;
    width: number;
    height: number;
};

export type DashboardChartItem = {
    id: string;
    kind: 'chart';
    chartId: string;
    layout: DashboardItemLayout;
};

export type DashboardMetricItem = {
    id: string;
    kind: 'metric';
    datasetId: string;
    name: string;
    expression: string;
    format: 'currency' | 'percent' | 'number';
    layout: DashboardItemLayout;
};

export type DashboardItem = DashboardChartItem | DashboardMetricItem;

export type Dashboard = {
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
