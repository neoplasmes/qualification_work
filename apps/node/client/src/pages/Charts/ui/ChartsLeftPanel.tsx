import { skipToken } from '@reduxjs/toolkit/query';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { WorkspaceLeftPanel, WorkspaceLeftPanelItem } from '@/widgets/WorkspaceLeftPanel';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import {
    filterApplicationEntities,
    selectFilterApplicationValues,
} from '@/features/filterApplicationEntities';

import { useListChartsQuery } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';
import { useListDatasetsQuery } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { Badge } from '@/shared/ui';

import { chartsTestIds } from '../const';
import { selectChart, selectSelectedChartId, setShowDatasetPicker } from '../model';

export const ChartsLeftPanel = () => {
    const dispatch = useDispatch();
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);

    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);

    const selectedChartId = useSelector(selectSelectedChartId);
    const filterValues = useSelector(selectFilterApplicationValues('charts'));

    const filteredCharts = filterApplicationEntities({
        scope: 'charts',
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
                onClick: () => dispatch(setShowDatasetPicker(true)),
            }}
        >
            {filteredCharts?.map(chart => (
                <WorkspaceLeftPanelItem
                    key={chart.id}
                    selected={selectedChartId === chart.id}
                    testId={chartsTestIds.chartListItem}
                    header={chart.name}
                    details={[
                        formatDate(chart.createdAt),
                        datasetNameById.get(chart.datasetId) ?? 'Unknown dataset',
                    ]}
                    iconElement={<Badge>{chart.chartType}</Badge>}
                    onClick={() => dispatch(selectChart(chart.id))}
                />
            ))}
        </WorkspaceLeftPanel>
    );
};
