import { filterDashboards } from '@/core/processes/entityFiltering';
import { useCommand } from '@/env/cache/useCommand';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import {
    useDashboardsPageActions,
    useDashboardsPageState,
} from '@/ui/pages/dashboards/model';
import { useFilters } from '@/ui/widgets/FilterPanel';
import { WorkspaceLeftPanel } from '@/ui/widgets/WorkspaceLeftPanel';
import { Button } from '@qualification-work/design-system';
import { LayoutDashboard, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { StatusMessage, WorkspaceLeftPanelItem } from '@/shared/ui';

import { dashboardsTestIds } from '../../const';
import { getDashboardWorkspaceUrl } from '../../lib';
import { useDashboardsController } from '../../model';

export const DashboardsLeftPanel = () => {
    const { selectDashboard } = useDashboardsPageActions();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const { org, dashboardsQuery, dependencies } = useDashboardsController();
    const chartsQuery = useRead(
        useDependencies().listCharts,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );
    const createState = useCommand(dependencies.createDashboard);

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

    const message =
        error ||
        (dashboardsQuery.error
            ? getApiErrorMessage(
                  dashboardsQuery.error,
                  'Не удалось загрузить список дашбордов.'
              )
            : '');

    const handleCreate = async () => {
        if (!org) {
            return;
        }

        setError('');

        try {
            const outcome = await createState.executeOutcome({
                orgId: org.id,
                name: 'Новый дашборд',
            });
            const result = outcome.data;
            selectDashboard(result.id);
            navigate(getDashboardWorkspaceUrl(result.id));
            if (outcome.syncError) {
                setError(
                    'Дашборд создан, но обновление данных не удалось. Обновите список.'
                );
            }
        } catch (createError) {
            setError(getApiErrorMessage(createError, 'Unable to create this dashboard.'));
        }
    };

    return (
        <WorkspaceLeftPanel
            title="Дашборды"
            countLabel={`Всего: ${filteredDashboards?.length ?? 0}`}
            testId={dashboardsTestIds.listPanel}
            listLabel="Дашборды"
            loading={dashboardsQuery.isPending}
            loadingText="Загружаем дашборды..."
            empty={filteredDashboards?.length === 0}
            emptyText="Создайте дашборд для графиков и метрик."
            status={
                message ? (
                    <StatusMessage tone="error">
                        {message}
                        <Button
                            variant="ghost"
                            onClick={() => {
                                void dependencies.cache
                                    .read(dependencies.listDashboards, {
                                        orgId: org?.id ?? '',
                                    })
                                    .then(() => setError(''))
                                    .catch(() => {});
                            }}
                        >
                            Обновить список
                        </Button>
                    </StatusMessage>
                ) : null
            }
            action={{
                label: 'Новый дашборд',
                Icon: Plus,
                testId: dashboardsTestIds.createButton,
                isLoading: createState.isPending,
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
