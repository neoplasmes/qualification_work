import {
    type FilterApplicationEntity,
    type FilterApplicationScope,
} from '@/core/processes/entityFiltering';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { useActiveOrganization, useSession } from '@/ui/session';
import {
    filterApplicationEffectKinds,
    filterApplicationEntityConfigs,
} from '@/ui/widgets/FilterPanel/const';
import { useMemo } from 'react';

import type { StaticFilterPanelSourceItem } from './types';

const hasEntitySource = (
    scope: FilterApplicationScope,
    entity: FilterApplicationEntity
) => filterApplicationEntityConfigs[scope].tabs.some(tab => tab.entity === entity);

export const useFilterPanelSources = (scope: FilterApplicationScope) => {
    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);

    const shouldLoadDatasets = Boolean(org?.id && hasEntitySource(scope, 'datasets'));
    const shouldLoadCharts = Boolean(org?.id && hasEntitySource(scope, 'charts'));
    const shouldLoadDashboards = Boolean(org?.id && hasEntitySource(scope, 'dashboards'));

    const dependencies = useDependencies();
    const datasetsQuery = useRead(
        dependencies.listDatasets,
        { orgId: org?.id ?? '' },
        { enabled: shouldLoadDatasets }
    );
    const chartsQuery = useRead(
        useDependencies().listCharts,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(shouldLoadCharts && org) }
    );
    const dashboardsQuery = useRead(
        dependencies.listDashboards,
        { orgId: org?.id ?? '' },
        { enabled: shouldLoadDashboards }
    );

    const effects = useMemo<StaticFilterPanelSourceItem[]>(
        () =>
            filterApplicationEffectKinds.map(kind => ({
                id: kind,
                label: kind === 'insertRow' ? 'Добавить строку' : 'Изменить по условию',
                meta: [kind],
            })),
        []
    );

    return {
        charts: chartsQuery.data,
        dashboards: dashboardsQuery.data,
        datasets: datasetsQuery.data,
        effects,
    };
};
