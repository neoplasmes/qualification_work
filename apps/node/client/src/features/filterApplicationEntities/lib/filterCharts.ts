import type { Chart } from '@/entities/chart';
import type { Dashboard } from '@/entities/dashboard';

type FilterChartsParams = {
    charts: Chart[] | undefined;
    dashboards: Dashboard[] | undefined;
    datasetIds: string[];
    dashboardIds: string[];
};

export const filterCharts = ({
    charts,
    dashboards,
    datasetIds,
    dashboardIds,
}: FilterChartsParams) => {
    if (!charts) {
        return charts;
    }

    let result = charts;

    if (datasetIds.length > 0) {
        result = result.filter(chart => datasetIds.includes(chart.datasetId));
    }

    if (dashboardIds.length > 0) {
        const chartIdsInDashboards = getChartIdsInDashboards(
            dashboards ?? [],
            dashboardIds
        );
        result = result.filter(chart => chartIdsInDashboards.has(chart.id));
    }

    return result;
};

export const getChartIdsInDashboards = (
    dashboards: Dashboard[],
    dashboardIds: string[]
) =>
    new Set(
        dashboards
            .filter(dashboard => dashboardIds.includes(dashboard.id))
            .flatMap(dashboard =>
                (dashboard.items ?? [])
                    .filter(item => item.kind === 'chart')
                    .map(item => item.chartId)
            )
    );
