import type { Chart } from '@/entities/chart';
import type { Dashboard } from '@/entities/dashboard';

type FilterDashboardsParams = {
    dashboards: Dashboard[] | undefined;
    charts: Chart[] | undefined;
    chartIds: string[];
    datasetIds: string[];
};

export const filterDashboards = ({
    dashboards,
    charts,
    chartIds,
    datasetIds,
}: FilterDashboardsParams) => {
    if (!dashboards) {
        return dashboards;
    }

    let result = dashboards;

    if (chartIds.length > 0) {
        result = result.filter(dashboard =>
            (dashboard.items ?? []).some(
                item => item.kind === 'chart' && chartIds.includes(item.chartId)
            )
        );
    }

    if (datasetIds.length > 0) {
        const chartIdsFromDatasets = getChartIdsFromDatasets(charts ?? [], datasetIds);
        result = result.filter(dashboard =>
            (dashboard.items ?? []).some(
                item => item.kind === 'chart' && chartIdsFromDatasets.has(item.chartId)
            )
        );
    }

    return result;
};

export const getChartIdsFromDatasets = (charts: Chart[], datasetIds: string[]) =>
    new Set(
        charts
            .filter(chart => datasetIds.includes(chart.datasetId))
            .map(chart => chart.id)
    );
