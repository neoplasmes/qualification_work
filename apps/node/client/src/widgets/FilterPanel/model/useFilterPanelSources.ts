import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo } from 'react';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import {
    filterApplicationEffectKinds,
    filterApplicationEntityConfigs,
    filterApplicationRunStatuses,
    type FilterApplicationEntity,
    type FilterApplicationScope,
} from '@/features/filterApplicationEntities';

import { getEffectLabel } from '@/entities/action';
import { useListChartsQuery } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';
import { useListDatasetsQuery } from '@/entities/dataset';

import type { StaticFilterPanelSourceItem } from './types';

const hasEntitySource = (
    scope: FilterApplicationScope,
    entity: FilterApplicationEntity
) => filterApplicationEntityConfigs[scope].tabs.some(tab => tab.entity === entity);

export const useFilterPanelSources = (scope: FilterApplicationScope) => {
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);

    const shouldLoadDatasets = Boolean(org?.id && hasEntitySource(scope, 'datasets'));
    const shouldLoadCharts = Boolean(org?.id && hasEntitySource(scope, 'charts'));
    const shouldLoadDashboards = Boolean(org?.id && hasEntitySource(scope, 'dashboards'));

    const datasetsQuery = useListDatasetsQuery(
        shouldLoadDatasets && org ? org.id : skipToken
    );
    const chartsQuery = useListChartsQuery(shouldLoadCharts && org ? org.id : skipToken);
    const dashboardsQuery = useListDashboardsQuery(
        shouldLoadDashboards && org ? org.id : skipToken
    );

    const effects = useMemo<StaticFilterPanelSourceItem[]>(
        () =>
            filterApplicationEffectKinds.map(kind => ({
                id: kind,
                label: getEffectLabel(kind),
                meta: [kind],
            })),
        []
    );
    const runs = useMemo<StaticFilterPanelSourceItem[]>(
        () =>
            filterApplicationRunStatuses.map(status => ({
                id: status,
                label: status,
                meta: ['Run status'],
            })),
        []
    );

    return {
        charts: chartsQuery.data,
        dashboards: dashboardsQuery.data,
        datasets: datasetsQuery.data,
        effects,
        runs,
    };
};
