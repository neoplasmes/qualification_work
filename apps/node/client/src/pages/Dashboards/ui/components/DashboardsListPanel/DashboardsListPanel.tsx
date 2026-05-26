import { skipToken } from '@reduxjs/toolkit/query';
import { LayoutDashboard, Plus, RefreshCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import { useCreateDashboardMutation } from '@/features/manageDashboards';

import { useListChartsQuery } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import {
    Button,
    EmptyState,
    FormField,
    IconButton,
    SectionHeader,
    StatusMessage,
    TextInput,
} from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';
import { filterDashboards } from '../../../lib';
import {
    selectDashboard,
    selectFilterChartIds,
    selectFilterDatasetIds,
    selectSelectedDashboardId,
} from '../../../model';

import styles from './DashboardsListPanel.module.scss';

export const DashboardsListPanel = () => {
    const dispatch = useDispatch();
    const [name, setName] = useState('');
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

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!org) {
            return;
        }

        const trimmed = name.trim();
        if (!trimmed) {
            setError('Dashboard name can not be empty.');

            return;
        }

        setError('');

        try {
            const result = await createDashboard({
                orgId: org.id,
                name: trimmed,
            }).unwrap();
            setName('');
            dispatch(selectDashboard(result.id));
            await dashboardsQuery.refetch();
        } catch (createError) {
            setError(getApiErrorMessage(createError, 'Unable to create this dashboard.'));
        }
    };

    return (
        <aside className={styles['panel']} data-test-id={dashboardsTestIds.listPanel}>
            <SectionHeader
                title="Dashboards"
                headingLevel={1}
                description={`${filteredDashboards?.length ?? 0} dashboards`}
                actions={
                    <IconButton
                        aria-label="Refresh dashboards"
                        disabled={dashboardsQuery.isFetching}
                        onClick={() => void dashboardsQuery.refetch()}
                    >
                        <RefreshCcw size={18} />
                    </IconButton>
                }
            />

            <form
                className={styles['create-form']}
                data-test-id={dashboardsTestIds.createForm}
                onSubmit={handleSubmit}
            >
                <FormField label="New dashboard">
                    <TextInput
                        data-test-id={dashboardsTestIds.createNameInput}
                        value={name}
                        placeholder="Sales overview"
                        onChange={event => setName(event.target.value)}
                    />
                </FormField>
                <Button
                    type="submit"
                    data-test-id={dashboardsTestIds.createButton}
                    disabled={createState.isLoading}
                >
                    <Plus size={18} />
                    Create
                </Button>
            </form>

            {error && <StatusMessage tone="error">{error}</StatusMessage>}

            <section className={styles['dashboard-list']} aria-label="Dashboards">
                {dashboardsQuery.isLoading && (
                    <StatusMessage centered>Loading dashboards...</StatusMessage>
                )}
                {filteredDashboards?.length === 0 && (
                    <EmptyState>Create a dashboard to arrange saved charts.</EmptyState>
                )}
                {filteredDashboards?.map(item => (
                    <button
                        type="button"
                        key={item.id}
                        data-test-id={dashboardsTestIds.dashboardListItem}
                        className={`${styles['dashboard-item']} ${
                            selectedDashboardId === item.id ? styles['selected'] : ''
                        }`}
                        onClick={() => dispatch(selectDashboard(item.id))}
                    >
                        <div>
                            <div className={styles['dashboard-name']}>{item.name}</div>
                            <div className={styles['dashboard-meta']}>
                                <span>{item.items?.length ?? 0} widgets</span>
                                <span>{formatDate(item.createdAt)}</span>
                            </div>
                        </div>
                        <LayoutDashboard size={18} />
                    </button>
                ))}
            </section>
        </aside>
    );
};
