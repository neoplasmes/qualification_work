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
