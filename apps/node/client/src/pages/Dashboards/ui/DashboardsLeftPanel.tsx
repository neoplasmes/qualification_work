import { skipToken } from '@reduxjs/toolkit/query';
import { LayoutDashboard, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { WorkspaceLeftPanel, WorkspaceLeftPanelItem } from '@/widgets/WorkspaceLeftPanel';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import { useCreateDashboardMutation } from '@/features/manageDashboards';

import { useListChartsQuery } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { StatusMessage } from '@/shared/ui';

import { dashboardsTestIds } from '../const';
import { filterDashboards } from '../lib';
import {
    selectDashboard,
    selectFilterChartIds,
    selectFilterDatasetIds,
    selectSelectedDashboardId,
} from '../model';

export const DashboardsLeftPanel = () => {
    const dispatch = useDispatch();
    const [error, setError] = useState('');

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const [createDashboard, createState] = useCreateDashboardMutation();

    const selectedDashboardId = useSelector(selectSelectedDashboardId);
    const filterChartIds = useSelector(selectFilterChartIds);
    const filterDatasetIds = useSelector(selectFilterDatasetIds);

    const filteredDashboards = useMemo(
        () =>
            filterDashboards({
                dashboards: dashboardsQuery.data,
                charts: chartsQuery.data,
                chartIds: filterChartIds,
                datasetIds: filterDatasetIds,
            }),
        [dashboardsQuery.data, chartsQuery.data, filterChartIds, filterDatasetIds]
    );

    const handleCreate = async () => {
        if (!org) {
            return;
        }

        setError('');

        try {
            const result = await createDashboard({
                orgId: org.id,
                name: 'New dashboard',
            }).unwrap();
            dispatch(selectDashboard(result.id));
            await dashboardsQuery.refetch();
        } catch (createError) {
            setError(getApiErrorMessage(createError, 'Unable to create this dashboard.'));
        }
    };

    return (
        <WorkspaceLeftPanel
            title="Dashboards"
            countLabel={`Total: ${filteredDashboards?.length ?? 0} dashboards`}
            testId={dashboardsTestIds.listPanel}
            listLabel="Dashboards"
            loading={dashboardsQuery.isLoading}
            loadingText="Loading dashboards..."
            empty={filteredDashboards?.length === 0}
            emptyText="Create a dashboard to arrange saved charts."
            status={error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
            action={{
                label: 'New dashboard',
                icon: <Plus size={18} />,
                testId: dashboardsTestIds.createButton,
                isLoading: createState.isLoading,
                onClick: () => void handleCreate(),
            }}
        >
            {filteredDashboards?.map(item => (
                <WorkspaceLeftPanelItem
                    key={item.id}
                    selected={selectedDashboardId === item.id}
                    testId={dashboardsTestIds.dashboardListItem}
                    header={item.name}
                    details={[formatDate(item.createdAt)]}
                    iconElement={<LayoutDashboard size={18} />}
                    onClick={() => dispatch(selectDashboard(item.id))}
                />
            ))}
        </WorkspaceLeftPanel>
    );
};
