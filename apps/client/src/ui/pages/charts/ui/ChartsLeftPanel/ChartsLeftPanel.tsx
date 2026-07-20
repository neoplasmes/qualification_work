import { filterCharts } from '@/core/processes/entityFiltering';
import { useChartsPageActions, useChartsPageState } from '@/ui/pages/charts/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import { useFilters } from '@/ui/widgets/FilterPanel';
import { WorkspaceLeftPanel } from '@/ui/widgets/WorkspaceLeftPanel';
import { skipToken } from '@reduxjs/toolkit/query';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';

import { CHART_KIND_ICONS as chartKindIcons, useListChartsQuery } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';
import { useListDatasetsQuery } from '@/entities/dataset';

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

    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);

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
            loading={chartsQuery.isLoading}
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
