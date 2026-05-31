import type { Action, ActionRun } from '@/entities/action';
import type { Chart } from '@/entities/chart';
import type { Dashboard } from '@/entities/dashboard';
import type { DatasetMetadata } from '@/entities/dataset';

import type { FilterApplicationEntityValues } from '../types';
import { filterActions } from './filterActions';
import { filterCharts } from './filterCharts';
import { filterDashboards } from './filterDashboards';
import { filterDatasets } from './filterDatasets';

type FilterActionsApplicationParams = {
    scope: 'actions';
    actions: Action[] | undefined;
    runs: ActionRun[] | undefined;
    values: FilterApplicationEntityValues;
};

type FilterChartsApplicationParams = {
    scope: 'charts';
    charts: Chart[] | undefined;
    dashboards: Dashboard[] | undefined;
    values: FilterApplicationEntityValues;
};

type FilterDashboardsApplicationParams = {
    scope: 'dashboards';
    dashboards: Dashboard[] | undefined;
    charts: Chart[] | undefined;
    values: FilterApplicationEntityValues;
};

type FilterDatasetsApplicationParams = {
    scope: 'datasets';
    datasets: DatasetMetadata[] | undefined;
    charts: Chart[] | undefined;
    dashboards: Dashboard[] | undefined;
    values: FilterApplicationEntityValues;
};

type FilterApplicationEntitiesParams =
    | FilterActionsApplicationParams
    | FilterChartsApplicationParams
    | FilterDashboardsApplicationParams
    | FilterDatasetsApplicationParams;

export function filterApplicationEntities(
    params: FilterActionsApplicationParams
): Action[] | undefined;
export function filterApplicationEntities(
    params: FilterChartsApplicationParams
): Chart[] | undefined;
export function filterApplicationEntities(
    params: FilterDashboardsApplicationParams
): Dashboard[] | undefined;
export function filterApplicationEntities(
    params: FilterDatasetsApplicationParams
): DatasetMetadata[] | undefined;
export function filterApplicationEntities(params: FilterApplicationEntitiesParams) {
    if (params.scope === 'actions') {
        return filterActions({
            actions: params.actions,
            datasetIds: params.values.datasets,
            effectKinds: params.values.effects,
            runStatuses: params.values.runs,
            runs: params.runs,
        });
    }

    if (params.scope === 'charts') {
        return filterCharts({
            charts: params.charts,
            dashboards: params.dashboards,
            datasetIds: params.values.datasets,
            dashboardIds: params.values.dashboards,
        });
    }

    if (params.scope === 'dashboards') {
        return filterDashboards({
            dashboards: params.dashboards,
            charts: params.charts,
            chartIds: params.values.charts,
            datasetIds: params.values.datasets,
        });
    }

    return filterDatasets({
        datasets: params.datasets,
        charts: params.charts,
        dashboards: params.dashboards,
        chartIds: params.values.charts,
        dashboardIds: params.values.dashboards,
    });
}
