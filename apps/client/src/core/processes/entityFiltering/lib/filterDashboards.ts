import type { Chart } from '@/core/entities/chart';
import type { Dashboard } from '@qualification-work/types';

import type { FilterApplicationEntityValues } from '../types';

type FilterDashboardsParams = {
    dashboards: Dashboard[] | undefined;
    charts: Chart[] | undefined;
    values: Pick<FilterApplicationEntityValues, 'charts' | 'datasets'>;
};

export const filterDashboards = ({
    dashboards,
    charts,
    values,
}: FilterDashboardsParams) => {
    if (!dashboards) {
        return dashboards;
    }

    const chartIds = values.charts;
    const datasetIds = values.datasets;

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
