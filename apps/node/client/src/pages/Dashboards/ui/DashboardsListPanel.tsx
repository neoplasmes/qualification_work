import { LayoutDashboard, Plus, RefreshCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';

import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import { useListChartsQuery } from '@/features/charts';
import { useCreateDashboardMutation, useListDashboardsQuery } from '@/features/dashboards';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { Button, IconButton } from '@/shared/ui';

import {
    selectDashboard,
    selectSelectedDashboardId,
    selectFilterChartIds,
    selectFilterDatasetIds,
} from '../model/dashboardsPageSlice';

import styles from './DashboardsPage.module.scss';

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

    const filteredDashboards = useMemo(() => {
        const data = dashboardsQuery.data;
        if (!data) return data;

        let result = data;

        if (filterChartIds.length > 0) {
            result = result.filter(d =>
                (d.items ?? []).some(
                    item => item.kind === 'chart' && filterChartIds.includes(item.chartId)
                )
            );
        }

        if (filterDatasetIds.length > 0) {
            const chartIdsFromDatasets = new Set(
                (chartsQuery.data ?? [])
                    .filter(c => filterDatasetIds.includes(c.datasetId))
                    .map(c => c.id)
            );
            result = result.filter(d =>
                (d.items ?? []).some(
                    item => item.kind === 'chart' && chartIdsFromDatasets.has(item.chartId)
                )
            );
        }

        return result;
    }, [dashboardsQuery.data, chartsQuery.data, filterChartIds, filterDatasetIds]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!org) return;

        const trimmed = name.trim();
        if (!trimmed) {
            setError('Dashboard name can not be empty.');

            return;
        }

        setError('');

        try {
            const result = await createDashboard({ orgId: org.id, name: trimmed }).unwrap();
            setName('');
            dispatch(selectDashboard(result.id));
            await dashboardsQuery.refetch();
        } catch (createError) {
            setError(getApiErrorMessage(createError, 'Unable to create this dashboard.'));
        }
    };

    return (
        <aside className={styles['panel']}>
            <div data-stack="h" data-align="center" data-justify="between">
                <div data-stack="v" data-gap="xs">
                    <h1 className={styles['title']}>Dashboards</h1>
                    <p className={styles['muted']}>
                        {filteredDashboards?.length ?? 0} dashboards
                    </p>
                </div>
                <IconButton
                    aria-label="Refresh dashboards"
                    disabled={dashboardsQuery.isFetching}
                    onClick={() => void dashboardsQuery.refetch()}
                >
                    <RefreshCcw size={18} />
                </IconButton>
            </div>

            <form className={styles['create-form']} onSubmit={handleSubmit}>
                <label className={styles['control']}>
                    <span>New dashboard</span>
                    <input
                        value={name}
                        placeholder="Sales overview"
                        onChange={event => setName(event.target.value)}
                    />
                </label>
                <Button type="submit" disabled={createState.isLoading}>
                    <Plus size={18} />
                    Create
                </Button>
            </form>

            {error && (
                <div role="alert" className={`${styles['status']} ${styles['error']}`}>
                    {error}
                </div>
            )}

            <section className={styles['dashboard-list']} aria-label="Dashboards">
                {dashboardsQuery.isLoading && (
                    <div className={styles['status']}>Loading dashboards...</div>
                )}
                {filteredDashboards?.length === 0 && (
                    <div className={styles['empty']}>
                        Create a dashboard to arrange saved charts.
                    </div>
                )}
                {filteredDashboards?.map(item => (
                    <button
                        type="button"
                        key={item.id}
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
