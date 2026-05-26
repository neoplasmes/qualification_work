import { skipToken } from '@reduxjs/toolkit/query';
import { Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import { WorkspaceLeftPanel, WorkspaceLeftPanelItem } from '@/widgets/WorkspaceLeftPanel';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListChartsQuery } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';

import { formatDate } from '@/shared/lib/formatDate';
import { Badge } from '@/shared/ui';

import { chartsTestIds } from '../const';
import { filterCharts } from '../lib';
import {
    selectChart,
    selectFilterDashboardIds,
    selectFilterDatasetIds,
    selectSelectedChartId,
    setShowDatasetPicker,
} from '../model';

export const ChartsLeftPanel = () => {
    const dispatch = useDispatch();
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);

    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);

    const selectedChartId = useSelector(selectSelectedChartId);
    const filterDatasetIds = useSelector(selectFilterDatasetIds);
    const filterDashboardIds = useSelector(selectFilterDashboardIds);

    const filteredCharts = filterCharts({
        charts: chartsQuery.data,
        dashboards: dashboardsQuery.data,
        datasetIds: filterDatasetIds,
        dashboardIds: filterDashboardIds,
    });

    return (
        <WorkspaceLeftPanel
            title="Charts"
            countLabel={filteredCharts ? `${filteredCharts.length} charts` : 'Loading'}
            testId={chartsTestIds.listPanel}
            listLabel="Saved charts"
            loading={chartsQuery.isLoading}
            loadingText="Loading charts..."
            empty={filteredCharts?.length === 0}
            emptyText="Build a chart from a dataset to see it here."
            action={{
                label: 'Create chart',
                icon: <Plus size={18} />,
                testId: chartsTestIds.createChartButton,
                onClick: () => dispatch(setShowDatasetPicker(true)),
            }}
        >
            {filteredCharts?.map(chart => (
                <WorkspaceLeftPanelItem
                    key={chart.id}
                    selected={selectedChartId === chart.id}
                    testId={chartsTestIds.chartListItem}
                    title={chart.name}
                    meta={[formatDate(chart.createdAt), chart.datasetId.slice(0, 8)]}
                    badge={<Badge>{chart.chartType}</Badge>}
                    onClick={() => dispatch(selectChart(chart.id))}
                />
            ))}
        </WorkspaceLeftPanel>
    );
};
