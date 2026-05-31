import { skipToken } from '@reduxjs/toolkit/query';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

import { WorkspaceLeftPanel } from '@/widgets/WorkspaceLeftPanel';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import {
    filterApplicationEntities,
    selectFilterApplicationValues,
} from '@/features/filterApplicationEntities';

import { CHART_KIND_ICONS, useListChartsQuery } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';
import { useListDatasetsQuery } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { WorkspaceLeftPanelItem } from '@/shared/ui';

import { chartsTestIds } from '../const';
import { getChartWorkspaceUrl } from '../lib';
import { selectChart, selectSelectedChartId, setShowDatasetPicker } from '../model';

const chartIconSize = 18;

export const ChartsLeftPanel = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
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
                onClick: () => {
                    navigate('/charts');
                    dispatch(setShowDatasetPicker(true));
                },
            }}
        >
            {filteredCharts?.map(chart => {
                const ChartIcon = CHART_KIND_ICONS[chart.chartType];

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
                            dispatch(selectChart(chart.id));
                            navigate(getChartWorkspaceUrl(chart.id, 'view'));
                        }}
                    />
                );
            })}
        </WorkspaceLeftPanel>
    );
};
