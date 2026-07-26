import type { Dashboard } from '@/core/entities/dashboard';
import type {
    MetricTargetDirection,
    MetricTimeBucket,
} from '@/core/entities/dashboardItem';

import type { ReadOptions } from '../readOptions';

export type ListDashboardsInput = { orgId: string };
export type DashboardScope = ListDashboardsInput & { dashboardId: string };
export type DashboardItemScope = DashboardScope & { itemId: string };
export type CreateDashboardInput = ListDashboardsInput & { name: string };
export type RenameDashboardInput = DashboardScope & { name: string };
export type AddChartInput = DashboardScope & { chartId: string; height?: number };
export type MetricInput = {
    datasetId: string;
    name: string;
    expression: string;
    format?: string;
    valueMultiplier?: number;
    target?: number | null;
    targetDirection?: MetricTargetDirection | null;
    showTrend?: boolean;
    timeColumn?: string | null;
    timeBucket?: MetricTimeBucket | null;
};
export type AddMetricInput = DashboardScope & MetricInput & { height?: number };
export type UpdateMetricInput = DashboardItemScope & MetricInput;
export type DashboardItemLayoutInput = {
    itemId: string;
    posX: number;
    posY: number;
    width: number;
    height: number;
};
export type UpdateLayoutInput = DashboardScope & { layout: DashboardItemLayoutInput[] };
export type PreviewMetricInput = ListDashboardsInput & {
    datasetId: string;
    expression: string;
};
export type MetricPreview = { value: number | null };
export type CreateDashboardResult = { id: string };
export type AddItemResult = { itemId: string; posY: number };

export interface DashboardRepo {
    listDashboards(
        input: ListDashboardsInput,
        options?: ReadOptions
    ): Promise<Dashboard[]>;
    getDashboard(input: DashboardScope, options?: ReadOptions): Promise<Dashboard>;
    previewDashboardMetric(
        input: PreviewMetricInput,
        options?: ReadOptions
    ): Promise<MetricPreview>;
    createDashboard(input: CreateDashboardInput): Promise<CreateDashboardResult>;
    renameDashboard(input: RenameDashboardInput): Promise<void>;
    addDashboardChart(input: AddChartInput): Promise<AddItemResult>;
    addDashboardMetric(input: AddMetricInput): Promise<AddItemResult>;
    updateDashboardMetric(input: UpdateMetricInput): Promise<void>;
    updateDashboardLayout(input: UpdateLayoutInput): Promise<void>;
    removeDashboardItem(input: DashboardItemScope): Promise<void>;
    deleteDashboard(input: DashboardScope): Promise<void>;
}
