import type { Chart } from '@qualification-work/types';

import type { Dashboard } from '@/entities/dashboard';
import type { DatasetMetadata } from '@/entities/dataset';

import type { FilterApplicationEntityValues } from '../types';

type FilterDatasetsParams = {
    datasets: DatasetMetadata[] | undefined;
    charts: Chart[] | undefined;
    dashboards: Dashboard[] | undefined;
    values: Pick<FilterApplicationEntityValues, 'charts' | 'dashboards'>;
};

export const filterDatasets = ({
    datasets,
    charts,
    dashboards,
    values,
}: FilterDatasetsParams) => {
    if (!datasets) {
        return datasets;
    }

    const chartIds = values.charts;
    const dashboardIds = values.dashboards;

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
