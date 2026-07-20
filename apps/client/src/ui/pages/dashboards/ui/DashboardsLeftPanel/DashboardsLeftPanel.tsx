import { filterDashboards } from '@/core/processes/entityFiltering';
import {
    useDashboardsPageActions,
    useDashboardsPageState,
} from '@/ui/pages/dashboards/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import { useFilters } from '@/ui/widgets/FilterPanel';
import { WorkspaceLeftPanel } from '@/ui/widgets/WorkspaceLeftPanel';
import { skipToken } from '@reduxjs/toolkit/query';
import { LayoutDashboard, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { useCreateDashboardMutation } from '@/features/manageDashboards';

import { useListChartsQuery } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { StatusMessage, WorkspaceLeftPanelItem } from '@/shared/ui';

import { dashboardsTestIds } from '../../const';
import { getDashboardWorkspaceUrl } from '../../lib';

export const DashboardsLeftPanel = () => {
    const { selectDashboard } = useDashboardsPageActions();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const [createDashboard, createState] = useCreateDashboardMutation();

    const selectedDashboardId = useDashboardsPageState(
        state => state.selectedDashboardId
    );
    const filterValues = useFilters(state => state.values['dashboards']);

    const filteredDashboards = useMemo(
        () =>
            filterDashboards({
                dashboards: dashboardsQuery.data,
                charts: chartsQuery.data,
                values: filterValues,
            }),
        [dashboardsQuery.data, chartsQuery.data, filterValues]
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
            selectDashboard(result.id);
            navigate(getDashboardWorkspaceUrl(result.id));
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
                Icon: Plus,
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
                    onClick={() => {
                        selectDashboard(item.id);
                        navigate(getDashboardWorkspaceUrl(item.id));
                    }}
                />
            ))}
        </WorkspaceLeftPanel>
    );
};
