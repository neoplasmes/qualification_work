import type {
    AddDashboardChartPayload as AddDashboardChartBodyPayload,
    AddDashboardItemResponse,
    AddDashboardMetricPayload as AddDashboardMetricBodyPayload,
    CreateDashboardPayload,
    CreateDashboardResponse,
    PreviewDashboardMetricPayload,
    PreviewDashboardMetricResponse,
    RenameDashboardPayload as RenameDashboardBodyPayload,
    UpdateDashboardLayoutPayload as UpdateDashboardLayoutBodyPayload,
    UpdateDashboardMetricPayload as UpdateDashboardMetricBodyPayload,
} from '@qualification-work/types';

export type {
    AddDashboardItemResponse,
    CreateDashboardPayload,
    CreateDashboardResponse,
    PreviewDashboardMetricPayload,
    PreviewDashboardMetricResponse,
};

export type AddDashboardChartPayload = Omit<AddDashboardChartBodyPayload, 'kind'> & {
    dashboardId: string;
};

export type AddDashboardMetricPayload = Omit<AddDashboardMetricBodyPayload, 'kind'> & {
    dashboardId: string;
};

export type UpdateDashboardMetricPayload = Omit<
    UpdateDashboardMetricBodyPayload,
    'kind'
> & {
    dashboardId: string;
    itemId: string;
};

export type RenameDashboardPayload = RenameDashboardBodyPayload & {
    dashboardId: string;
};

export type RemoveDashboardItemPayload = {
    dashboardId: string;
    itemId: string;
};

export type UpdateDashboardLayoutPayload = UpdateDashboardLayoutBodyPayload & {
    dashboardId: string;
};
