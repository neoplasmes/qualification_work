import type { Chart } from '@qualification-work/types';

import type { Dashboard } from '@/entities/dashboard';

import type { FilterApplicationEntityValues } from '../types';

type FilterChartsParams = {
    charts: Chart[] | undefined;
    dashboards: Dashboard[] | undefined;
    values: Pick<FilterApplicationEntityValues, 'datasets' | 'dashboards'>;
};

export const filterCharts = ({ charts, dashboards, values }: FilterChartsParams) => {
    if (!charts) {
        return charts;
    }

    const datasetIds = values.datasets;
    const dashboardIds = values.dashboards;

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
