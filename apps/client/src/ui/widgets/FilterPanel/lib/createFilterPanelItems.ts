import type {
    FilterApplicationEntity,
    FilterApplicationScope,
} from '@/core/processes/entityFiltering';
import type { Chart } from '@qualification-work/types';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import type { Dashboard } from '@/entities/dashboard';

import { formatDate } from '@/shared/lib/formatDate';

import type { FilterPanelItem, StaticFilterPanelSourceItem } from '../model';

type FilterPanelSources = {
    charts: Chart[] | undefined;
    dashboards: Dashboard[] | undefined;
    datasets: DatasetMetadata[] | undefined;
    effects: StaticFilterPanelSourceItem[];
};

type CreateFilterPanelItemsParams = {
    scope: FilterApplicationScope;
    entity: FilterApplicationEntity;
    sources: FilterPanelSources;
};

const createDatasetItems = (
    scope: FilterApplicationScope,
    datasets: DatasetMetadata[] | undefined
) =>
    datasets?.map(item => ({
        id: item.dataset.id,
        label: item.dataset.name,
        meta: [
            `${item.totalRows} rows`,
            formatDate(
                scope === 'actions' ? item.dataset.updatedAt : item.dataset.createdAt
            ),
        ],
    }));

const createChartItems = (charts: Chart[] | undefined) =>
    charts?.map(chart => ({
        id: chart.id,
        label: chart.name,
        chartKind: chart.chartType,
        meta: [chart.chartType, formatDate(chart.createdAt)],
    }));

const createDashboardItems = (dashboards: Dashboard[] | undefined) =>
    dashboards?.map(dashboard => ({
        id: dashboard.id,
        label: dashboard.name,
        meta: [formatDate(dashboard.createdAt)],
    }));

export const createFilterPanelItems = ({
    scope,
    entity,
    sources,
}: CreateFilterPanelItemsParams): FilterPanelItem[] | undefined => {
    switch (entity) {
        case 'datasets':
            return createDatasetItems(scope, sources.datasets);
        case 'charts':
            return createChartItems(sources.charts);
        case 'dashboards':
            return createDashboardItems(sources.dashboards);
        default:
            return sources.effects;
    }
};
