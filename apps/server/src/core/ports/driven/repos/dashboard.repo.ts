import type {
    Dashboard,
    DashboardChartItem,
    DashboardItemLayoutInput,
    DashboardMetricItem,
    PreviewDashboardMetricPayload,
    PreviewDashboardMetricResponse,
} from '@qualification-work/types';

/**
 * dashboard metric short specification for internal usage
 */
export type DashboardMetricSpec = Omit<
    DashboardMetricItem,
    'id' | 'kind' | 'layout' | 'value' | 'trend'
>;

/**
 * repository for working with user's dashboards
 *
 * @export
 * @interface
 */
export interface DashboardRepo {
    /**
     * creates dashboard
     *
     * @param orgId
     * @param name
     * @returns
     */
    create(orgId: string, name: string): Promise<string>;

    /**
     * deletes dashboard
     *
     * @param id
     * @param userOrgIds
     * @returns
     */
    delete(id: string, userOrgIds: string[]): Promise<boolean>;

    /**
     * TODO: make behaviour more 'patch'-like, not only for name
     * updates dashboard name
     *
     * @param id
     * @param name
     * @param userOrgIds
     * @returns
     */
    updateName(id: string, name: string, userOrgIds: string[]): Promise<boolean>;

    /**
     * returns one specific dashboard by dashboard id
     *
     * @param id
     * @param userOrgIds
     * @returns
     */
    findById(id: string, userOrgIds: string[]): Promise<Dashboard | null>;

    /**
     * returns all dashboards related to provided org id
     *
     * @param orgId
     * @param userOrgIds
     * @returns
     */
    listByOrg(orgId: string, userOrgIds: string[]): Promise<Dashboard[]>;

    /**
     * previews a metric expression against a readable dataset without saving it
     *
     * @param metric
     * @param userOrgIds
     * @returns computed value, or null if the dataset is not readable
     */
    previewMetric(
        metric: PreviewDashboardMetricPayload,
        userOrgIds: string[]
    ): Promise<PreviewDashboardMetricResponse | null>;

    /**
     * adds a chart to dashboards
     *
     * @param dashboardId
     * @param chartId
     * @param height
     * @param userOrgIds
     * @returns itemId and stack position | null if there is no such dashboardId
     * or user has no rights to modify this dashboard
     */
    addChartItem(
        dashboardId: string,
        chartId: DashboardChartItem['chartId'],
        height: number | undefined,
        userOrgIds: string[]
    ): Promise<{ itemId: string; posY: number } | null>;

    /**
     * adds a metric card to dashboard
     *
     * @param dashboardId
     * @param metric
     * @param height
     * @param userOrgIds
     * @returns itemId and stack position | null if there is no such dashboardId
     * or user has no rights to modify this dashboard
     */
    addMetricItem(
        dashboardId: string,
        metric: DashboardMetricSpec,
        height: number | undefined,
        userOrgIds: string[]
    ): Promise<{ itemId: string; posY: number } | null>;

    /**
     * updates an existing metric item on a specific dashboard
     *
     * @param dashboardId
     * @param itemId
     * @param metric
     * @param userOrgIds
     * @returns true if the metric was updated, false if not found
     * or user has no rights to modify this dashboard
     */
    updateMetricItem(
        dashboardId: string,
        itemId: string,
        metric: DashboardMetricSpec,
        userOrgIds: string[]
    ): Promise<boolean>;

    /**
     * removes an item from a specific dashboard
     *
     * @param dashboardId
     * @param itemId
     * @param userOrgIds
     * @returns
     */
    removeItem(
        dashboardId: string,
        itemId: string,
        userOrgIds: string[]
    ): Promise<boolean>;

    /**
     * updates item layout in a specific dashboard
     *
     * @param dashboardId
     * @param layout
     * @param userOrgIds
     * @returns
     */
    updateItemsLayout(
        dashboardId: string,
        layout: DashboardItemLayoutInput[],
        userOrgIds: string[]
    ): Promise<{
        dashboardFound: boolean;
        itemCount: number;
        matchedCount: number;
        invalidSizeCount: number;
        updatedCount: number;
    }>;
}
