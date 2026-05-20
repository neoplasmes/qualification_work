import { skipToken } from '@reduxjs/toolkit/query';
import { ArrowDown, ArrowUp, Plus, RefreshCcw, Save, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import { useListChartsQuery, type Chart } from '@/features/charts';
import { useListDatasetsQuery } from '@/features/datasets';
import {
    useAddDashboardChartMutation,
    useAddDashboardMetricMutation,
    useCreateDashboardMutation,
    useDeleteDashboardMutation,
    useGetDashboardQuery,
    useListDashboardsQuery,
    useReorderDashboardItemsMutation,
    useRemoveDashboardItemMutation,
    useRenameDashboardMutation,
} from '@/features/dashboards';
import { getApiErrorMessage } from '@/shared/api';
import { Button, ButtonLink, IconButton } from '@/shared/ui';
import { getSelected } from '@/shared/lib/getSelected';

import { WorkspaceGrid } from '@/widgets/WorkspaceGrid';

import { DashboardChartCard } from './DashboardChartCard';
import { DashboardsListPanel } from './DashboardsListPanel';
import styles from './DashboardsPage.module.scss';

export const DashboardsPage = () => {
    const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(
        null
    );
    const [draftName, setDraftName] = useState('');
    const [selectedChartId, setSelectedChartId] = useState('');
    const [selectedMetricDatasetId, setSelectedMetricDatasetId] = useState('');
    const [metricName, setMetricName] = useState('');
    const [metricExpression, setMetricExpression] = useState('');
    const [metricFormat, setMetricFormat] = useState<'currency' | 'percent' | 'number'>(
        'number'
    );
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(
        null
    );
    const [error, setError] = useState('');

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const selectedListDashboard = useMemo(
        () => getSelected(dashboardsQuery.data, selectedDashboardId),
        [dashboardsQuery.data, selectedDashboardId]
    );
    const dashboardQuery = useGetDashboardQuery(
        selectedListDashboard?.id ?? skipToken
    );
    const dashboard = dashboardQuery.data ?? selectedListDashboard;
    const dashboardItems = dashboard?.items ?? [];
    const chartsById = useMemo(
        () => new Map((chartsQuery.data ?? []).map((chart: Chart) => [chart.id, chart])),
        [chartsQuery.data]
    );

    const [createDashboard, createState] = useCreateDashboardMutation();
    const [renameDashboard, renameState] = useRenameDashboardMutation();
    const [deleteDashboard, deleteState] = useDeleteDashboardMutation();
    const [addDashboardChart, addChartState] = useAddDashboardChartMutation();
    const [addDashboardMetric, addMetricState] = useAddDashboardMetricMutation();
    const [reorderDashboardItems, reorderState] = useReorderDashboardItemsMutation();
    const [removeDashboardItem, removeItemState] = useRemoveDashboardItemMutation();

    useEffect(() => {
        setDraftName(dashboard?.name ?? '');
        setError('');
        setDeleteConfirmationId(null);
    }, [dashboard?.id, dashboard?.name]);

    useEffect(() => {
        setSelectedChartId(chartsQuery.data?.[0]?.id ?? '');
    }, [chartsQuery.data]);

    useEffect(() => {
        setSelectedMetricDatasetId(datasetsQuery.data?.[0]?.dataset.id ?? '');
    }, [datasetsQuery.data]);

    const handleCreateDashboard = async (name: string) => {
        if (!org) {
            return;
        }

        const result = await createDashboard({ orgId: org.id, name }).unwrap();
        setSelectedDashboardId(result.id);
        await dashboardsQuery.refetch();
    };

    const handleRenameDashboard = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!dashboard) {
            return;
        }

        const name = draftName.trim();
        if (!name) {
            setError('Dashboard name can not be empty.');

            return;
        }

        try {
            await renameDashboard({ dashboardId: dashboard.id, name }).unwrap();
            await dashboardsQuery.refetch();
            await dashboardQuery.refetch();
        } catch (renameError) {
            setError(
                getApiErrorMessage(renameError, 'Unable to rename this dashboard.')
            );
        }
    };

    const handleAddChart = async () => {
        if (!dashboard || !selectedChartId) {
            return;
        }

        try {
            await addDashboardChart({
                dashboardId: dashboard.id,
                chartId: selectedChartId,
                height: 8,
            }).unwrap();
            await dashboardQuery.refetch();
        } catch (addError) {
            setError(getApiErrorMessage(addError, 'Unable to add this chart.'));
        }
    };

    const handleAddMetric = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!dashboard || !selectedMetricDatasetId) {
            return;
        }

        const name = metricName.trim();
        const expression = metricExpression.trim();
        if (!name || !expression) {
            setError('Metric name and expression are required.');

            return;
        }

        try {
            await addDashboardMetric({
                dashboardId: dashboard.id,
                datasetId: selectedMetricDatasetId,
                name,
                expression,
                format: metricFormat,
                height: 4,
            }).unwrap();
            setMetricName('');
            setMetricExpression('');
            setError('');
            await dashboardQuery.refetch();
        } catch (addError) {
            setError(getApiErrorMessage(addError, 'Unable to add this metric.'));
        }
    };

    const handleMoveItem = async (itemId: string, direction: -1 | 1) => {
        if (!dashboard) {
            return;
        }

        const currentIndex = dashboardItems.findIndex(item => item.id === itemId);
        const nextIndex = currentIndex + direction;
        if (currentIndex < 0 || nextIndex < 0 || nextIndex >= dashboardItems.length) {
            return;
        }

        const nextItems = [...dashboardItems];
        const [item] = nextItems.splice(currentIndex, 1);
        nextItems.splice(nextIndex, 0, item);

        try {
            await reorderDashboardItems({
                dashboardId: dashboard.id,
                order: nextItems.map((nextItem, index) => ({
                    itemId: nextItem.id,
                    posY: index,
                })),
            }).unwrap();
            await dashboardQuery.refetch();
        } catch (reorderError) {
            setError(
                getApiErrorMessage(reorderError, 'Unable to reorder dashboard widgets.')
            );
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        if (!dashboard) {
            return;
        }

        try {
            await removeDashboardItem({ dashboardId: dashboard.id, itemId }).unwrap();
            await dashboardQuery.refetch();
        } catch (removeError) {
            setError(getApiErrorMessage(removeError, 'Unable to remove this widget.'));
        }
    };

    const handleDeleteDashboard = async () => {
        if (!dashboard) {
            return;
        }

        if (deleteConfirmationId !== dashboard.id) {
            setDeleteConfirmationId(dashboard.id);

            return;
        }

        try {
            await deleteDashboard(dashboard.id).unwrap();
            setSelectedDashboardId(null);
            await dashboardsQuery.refetch();
        } catch (deleteError) {
            setError(
                getApiErrorMessage(deleteError, 'Unable to delete this dashboard.')
            );
        }
    };

    if (meQuery.isError) {
        return (
            <div className={styles['empty']}>
                <p>Sign in to view dashboards.</p>
                <ButtonLink to="/sign-in">Sign in</ButtonLink>
            </div>
        );
    }

    return (
        <WorkspaceGrid>
            <WorkspaceGrid.Group direction="row">
            <WorkspaceGrid.Panel initialSize="320px" minSize="280px" maxSize="440px">
            <DashboardsListPanel
                dashboards={dashboardsQuery.data}
                loading={dashboardsQuery.isLoading}
                selectedDashboard={selectedListDashboard}
                creating={createState.isLoading}
                onSelect={setSelectedDashboardId}
                onCreate={handleCreateDashboard}
            />
            </WorkspaceGrid.Panel>
            <WorkspaceGrid.Panel initialSize="800px" minSize="480px" maxSize="9999px">
            <section className={styles['panel']} aria-label="Dashboard details">
                {!dashboard && (
                    <div className={styles['empty']}>
                        Select or create a dashboard.
                    </div>
                )}

                {dashboard && (
                    <>
                        <div className={styles['detail-header']}>
                            <div data-stack="v" data-gap="xs">
                                <span className={styles['eyebrow']}>Dashboard</span>
                                <h2 className={styles['title']}>{dashboard.name}</h2>
                                <p className={styles['muted']}>
                                    {dashboardItems.length} widgets
                                </p>
                            </div>
                            <Button
                                variant="danger"
                                disabled={deleteState.isLoading}
                                onClick={() => void handleDeleteDashboard()}
                            >
                                <Trash2 size={18} />
                                {deleteConfirmationId === dashboard.id
                                    ? 'Confirm delete'
                                    : 'Delete'}
                            </Button>
                        </div>

                        <form
                            className={styles['edit-form']}
                            onSubmit={handleRenameDashboard}
                        >
                            <label className={styles['control']}>
                                <span>Name</span>
                                <input
                                    value={draftName}
                                    onChange={event => setDraftName(event.target.value)}
                                />
                            </label>
                            <Button
                                type="submit"
                                disabled={
                                    renameState.isLoading ||
                                    draftName.trim() === dashboard.name
                                }
                            >
                                <Save size={18} />
                                Save name
                            </Button>
                            <Button
                                disabled={dashboardQuery.isFetching}
                                onClick={() => void dashboardQuery.refetch()}
                            >
                                <RefreshCcw size={18} />
                                Refresh
                            </Button>
                        </form>

                        <div className={styles['add-chart']}>
                            <label className={styles['control']}>
                                <span>Add saved chart</span>
                                <select
                                    value={selectedChartId}
                                    onChange={event =>
                                        setSelectedChartId(event.target.value)
                                    }
                                >
                                    {chartsQuery.data?.map(chart => (
                                        <option key={chart.id} value={chart.id}>
                                            {chart.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <Button
                                disabled={!selectedChartId || addChartState.isLoading}
                                onClick={() => void handleAddChart()}
                            >
                                <Plus size={18} />
                                Add chart
                            </Button>
                        </div>

                        <form
                            className={styles['add-chart']}
                            aria-label="Add metric"
                            onSubmit={handleAddMetric}
                        >
                            <label className={styles['control']}>
                                <span>Metric dataset</span>
                                <select
                                    value={selectedMetricDatasetId}
                                    onChange={event =>
                                        setSelectedMetricDatasetId(event.target.value)
                                    }
                                >
                                    {datasetsQuery.data?.map(item => (
                                        <option
                                            key={item.dataset.id}
                                            value={item.dataset.id}
                                        >
                                            {item.dataset.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className={styles['control']}>
                                <span>Metric name</span>
                                <input
                                    value={metricName}
                                    placeholder="Average score"
                                    onChange={event => setMetricName(event.target.value)}
                                />
                            </label>
                            <label className={styles['control']}>
                                <span>Expression</span>
                                <input
                                    value={metricExpression}
                                    placeholder="avg(score)"
                                    onChange={event =>
                                        setMetricExpression(event.target.value)
                                    }
                                />
                            </label>
                            <label className={styles['control']}>
                                <span>Format</span>
                                <select
                                    value={metricFormat}
                                    onChange={event =>
                                        setMetricFormat(
                                            event.target.value as typeof metricFormat
                                        )
                                    }
                                >
                                    <option value="number">number</option>
                                    <option value="currency">currency</option>
                                    <option value="percent">percent</option>
                                </select>
                            </label>
                            <Button
                                type="submit"
                                disabled={
                                    !selectedMetricDatasetId || addMetricState.isLoading
                                }
                            >
                                <Plus size={18} />
                                Add metric
                            </Button>
                        </form>

                        {error && (
                            <div
                                role="alert"
                                className={`${styles['status']} ${styles['error']}`}
                            >
                                {error}
                            </div>
                        )}

                        <div className={styles['grid']} aria-label="Dashboard widgets">
                            {dashboardItems.length === 0 && (
                                <div className={styles['empty']}>
                                    Add a saved chart to this dashboard.
                                </div>
                            )}
                            {dashboardItems.map((item, index) =>
                                item.kind === 'chart' ? (
                                    <div key={item.id} className={styles['widget-wrap']}>
                                        <div className={styles['widget-actions']}>
                                            <IconButton
                                                aria-label={`Move ${chartsById.get(item.chartId)?.name ?? item.id} up`}
                                                disabled={
                                                    index === 0 || reorderState.isLoading
                                                }
                                                onClick={() =>
                                                    void handleMoveItem(item.id, -1)
                                                }
                                            >
                                                <ArrowUp size={17} />
                                            </IconButton>
                                            <IconButton
                                                aria-label={`Move ${chartsById.get(item.chartId)?.name ?? item.id} down`}
                                                disabled={
                                                    index === dashboardItems.length - 1 ||
                                                    reorderState.isLoading
                                                }
                                                onClick={() =>
                                                    void handleMoveItem(item.id, 1)
                                                }
                                            >
                                                <ArrowDown size={17} />
                                            </IconButton>
                                        </div>
                                        <DashboardChartCard
                                            item={item}
                                            chart={chartsById.get(item.chartId)}
                                            removing={removeItemState.isLoading}
                                            onRemove={handleRemoveItem}
                                        />
                                    </div>
                                ) : (
                                    <article
                                        key={item.id}
                                        className={styles['dashboard-card']}
                                    >
                                        <div className={styles['card-header']}>
                                            <div data-stack="v" data-gap="xs">
                                                <h3>{item.name}</h3>
                                                <p>
                                                    {item.expression} · {item.format}
                                                </p>
                                            </div>
                                            <div data-stack="h" data-gap="xs">
                                                <IconButton
                                                    aria-label={`Move ${item.name} up`}
                                                    disabled={
                                                        index === 0 ||
                                                        reorderState.isLoading
                                                    }
                                                    onClick={() =>
                                                        void handleMoveItem(item.id, -1)
                                                    }
                                                >
                                                    <ArrowUp size={17} />
                                                </IconButton>
                                                <IconButton
                                                    aria-label={`Move ${item.name} down`}
                                                    disabled={
                                                        index ===
                                                            dashboardItems.length - 1 ||
                                                        reorderState.isLoading
                                                    }
                                                    onClick={() =>
                                                        void handleMoveItem(item.id, 1)
                                                    }
                                                >
                                                    <ArrowDown size={17} />
                                                </IconButton>
                                                <IconButton
                                                    aria-label={`Remove ${item.name}`}
                                                    disabled={removeItemState.isLoading}
                                                    onClick={() =>
                                                        void handleRemoveItem(item.id)
                                                    }
                                                >
                                                    <X size={17} />
                                                </IconButton>
                                            </div>
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    </>
                )}
            </section>
            </WorkspaceGrid.Panel>
            </WorkspaceGrid.Group>
        </WorkspaceGrid>
    );
};
