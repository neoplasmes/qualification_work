/**
 * position and size of an item on the dashboard
 *
 ** for a while the convention is follow: posY - stack position, poX is always 0
 ** width is ignored and height is height
 */
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

/**
 * metrics display format
 */
export type MetricFormat = 'currency' | 'percent' | 'number';

export type DashboardMetricItem = DashboardBaseItem & {
    kind: 'metric';
    datasetId: string;
    name: string;
    expression: string;
    format: MetricFormat;
};

/**
 * kinds of items, that can be placed on a dashboard
 */
export type DashboardItemKind = DashboardMetricItem['kind'] | DashboardChartItem['kind'];

export type DashboardItem = DashboardChartItem | DashboardMetricItem;

export type Dashboard = {
    id: string;
    orgId: string;
    name: string;
    items: DashboardItem[];
    createdAt: string;
    updatedAt: string;
};
