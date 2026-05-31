import type { Chart } from '@/entities/chart';
import type { Dashboard } from '@/entities/dashboard';
import type { DatasetMetadata } from '@/entities/dataset';

type FilterDatasetsParams = {
    datasets: DatasetMetadata[] | undefined;
    charts: Chart[] | undefined;
    dashboards: Dashboard[] | undefined;
    chartIds: string[];
    dashboardIds: string[];
};

export const filterDatasets = ({
    datasets,
    charts,
    dashboards,
    chartIds,
    dashboardIds,
}: FilterDatasetsParams) => {
    if (!datasets) {
        return datasets;
    }

    let result = datasets;

    if (chartIds.length > 0) {
        const datasetIdsFromCharts = getDatasetIdsFromCharts(charts ?? [], chartIds);
        result = result.filter(item => datasetIdsFromCharts.has(item.dataset.id));
    }

    if (dashboardIds.length > 0) {
        const chartIdsInDashboards = getChartIdsInDashboards(
            dashboards ?? [],
            dashboardIds
        );
        const datasetIdsFromDashboards = getDatasetIdsFromCharts(
            charts ?? [],
            chartIdsInDashboards
        );
        result = result.filter(item => datasetIdsFromDashboards.has(item.dataset.id));
    }

    return result;
};

export const getDatasetIdsFromCharts = (charts: Chart[], chartIds: Iterable<string>) => {
    const chartIdSet = new Set(chartIds);

    return new Set(
        charts.filter(chart => chartIdSet.has(chart.id)).map(chart => chart.datasetId)
    );
};

export const getChartIdsInDashboards = (
    dashboards: Dashboard[],
    dashboardIds: Iterable<string>
) => {
    const dashboardIdSet = new Set(dashboardIds);

    return new Set(
        dashboards
            .filter(dashboard => dashboardIdSet.has(dashboard.id))
            .flatMap(dashboard =>
                (dashboard.items ?? [])
                    .filter(item => item.kind === 'chart')
                    .map(item => item.chartId)
            )
    );
};
