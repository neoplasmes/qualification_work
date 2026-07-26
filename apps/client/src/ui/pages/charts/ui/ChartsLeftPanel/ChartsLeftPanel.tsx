import { filterCharts } from '@/core/processes/entityFiltering';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { useChartsPageActions, useChartsPageState } from '@/ui/pages/charts/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import { chartKindIcons } from '@/ui/widgets/ChartShell';
import { useFilters } from '@/ui/widgets/FilterPanel';
import { WorkspaceLeftPanel } from '@/ui/widgets/WorkspaceLeftPanel';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';

import { formatDate } from '@/shared/lib/formatDate';
import { WorkspaceLeftPanelItem } from '@/shared/ui';

import { chartsTestIds } from '../../const';
import { chartsWorkspaceNewPath, getChartWorkspaceUrl } from '../../lib';

const chartIconSize = 18;

export const ChartsLeftPanel = () => {
    const { openNewChartRoute, selectChart } = useChartsPageActions();
    const navigate = useNavigate();
    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);

    const chartsQuery = useRead(
        useDependencies().listCharts,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );
    const dashboardsQuery = useRead(
        useDependencies().listDashboards,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );
    const dependencies = useDependencies();
    const datasetsQuery = useRead(
        dependencies.listDatasets,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );

    const selectedChartId = useChartsPageState(state => state.selectedChartId);
    const filterValues = useFilters(state => state.values['charts']);

    const filteredCharts = filterCharts({
        charts: chartsQuery.data,
        dashboards: dashboardsQuery.data,
        values: filterValues,
    });
    const datasetNameById = useMemo(
        () =>
            new Map(
                datasetsQuery.data?.map(item => [item.dataset.id, item.dataset.name]) ??
                    []
            ),
        [datasetsQuery.data]
    );

    return (
        <WorkspaceLeftPanel
            title="Charts"
            countLabel={`Total: ${filteredCharts?.length ?? 0} charts`}
            testId={chartsTestIds.listPanel}
            listLabel="Saved charts"
            loading={chartsQuery.isPending}
            loadingText="Loading charts..."
            empty={filteredCharts?.length === 0}
            emptyText="Build a chart from a dataset to see it here."
            action={{
                label: 'Create chart',
                Icon: Plus,
                testId: chartsTestIds.createChartButton,
                onClick: () => {
                    openNewChartRoute();
                    navigate(chartsWorkspaceNewPath);
                },
            }}
        >
            {filteredCharts?.map(chart => {
                const ChartIcon = chartKindIcons[chart.chartType];

                return (
                    <WorkspaceLeftPanelItem
                        key={chart.id}
                        selected={selectedChartId === chart.id}
                        testId={chartsTestIds.chartListItem}
                        header={chart.name}
                        details={[
                            formatDate(chart.createdAt),
                            datasetNameById.get(chart.datasetId) ?? 'Unknown dataset',
                        ]}
                        iconElement={<ChartIcon size={chartIconSize} />}
                        onClick={() => {
                            selectChart(chart.id);
                            navigate(getChartWorkspaceUrl(chart.id, 'view'));
                        }}
                    />
                );
            })}
        </WorkspaceLeftPanel>
    );
};
