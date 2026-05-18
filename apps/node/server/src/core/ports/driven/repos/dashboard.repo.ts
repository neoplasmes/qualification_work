import type {
    Dashboard,
    DashboardChartItem,
    DashboardMetricItem,
} from '@qualification-work/types';

/**
 * dashboard metric short specification for internal usage
 */
export type DashboardMetricSpec = Omit<DashboardMetricItem, 'id' | 'kind' | 'layout'>;

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
    listByOrg(orgId: string, userOrgIds: string[]): Promise<Omit<Dashboard, 'items'>[]>;

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
     * reorders items in a specific dashboard
     *
     * @param dashboardId
     * @param order
     * @param userOrgIds
     * @returns
     */
    reorderItems(
        dashboardId: string,
        order: Array<{ itemId: string; posY: number }>,
        userOrgIds: string[]
    ): Promise<{ dashboardFound: boolean; updatedCount: number }>;
}
