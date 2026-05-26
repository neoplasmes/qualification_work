import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import {
    useAddDashboardChartMutation,
    useAddDashboardMetricMutation,
    useRemoveDashboardItemMutation,
    useRenameDashboardMutation,
    useReorderDashboardItemsMutation,
} from '@/features/manageDashboards';

import { useListChartsQuery } from '@/entities/chart';
import {
    useDeleteDashboardMutation,
    useGetDashboardQuery,
    useListDashboardsQuery,
} from '@/entities/dashboard';
import { useListDatasetsQuery } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { getSelected } from '@/shared/lib/getSelected';
import { PanelPlaceholder, StatusMessage } from '@/shared/ui';

import { dashboardsTestIds } from '../const';
import { getDashboardItemsOrder, moveDashboardItem } from '../lib';
import {
    clearWorkspaceMetricForm,
    initDashboardsWorkspaceDraft,
    resetDashboardsWorkspaceDraft,
    selectDashboard,
    selectDashboardsWorkspaceDraftName,
    selectSelectedDashboardId,
    selectWorkspaceDraftDashboardId,
    selectWorkspaceMetricExpression,
    selectWorkspaceMetricFormat,
    selectWorkspaceMetricName,
    setDashboardsWorkspaceDraftName,
    setWorkspaceMetricExpression,
    setWorkspaceMetricFormat,
    setWorkspaceMetricName,
} from '../model';
import { AddChartForm } from './components/AddChartForm';
import { AddMetricForm } from './components/AddMetricForm';
import { DashboardNameForm } from './components/DashboardNameForm';
import { DashboardWidgets } from './components/DashboardWidgets';
import { WorkspaceHeader } from './components/WorkspaceHeader';

import styles from './DashboardsPage.module.scss';

export const DashboardsWorkspace = () => {
    const dispatch = useDispatch();
    const [selectedChartId, setSelectedChartId] = useState('');
    const [selectedMetricDatasetId, setSelectedMetricDatasetId] = useState('');
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const selectedDashboardId = useSelector(selectSelectedDashboardId);
    const workspaceDraftDashboardId = useSelector(selectWorkspaceDraftDashboardId);
    const draftName = useSelector(selectDashboardsWorkspaceDraftName);
    const metricName = useSelector(selectWorkspaceMetricName);
    const metricExpression = useSelector(selectWorkspaceMetricExpression);
    const metricFormat = useSelector(selectWorkspaceMetricFormat);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);

    const selectedListDashboard = useMemo(
        () => getSelected(dashboardsQuery.data, selectedDashboardId),
        [dashboardsQuery.data, selectedDashboardId]
    );
    const dashboardQuery = useGetDashboardQuery(selectedListDashboard?.id ?? skipToken);
    const dashboard = dashboardQuery.data ?? selectedListDashboard;
    const dashboardItems = dashboard?.items ?? [];

    const chartsById = useMemo(
        () => new Map((chartsQuery.data ?? []).map(chart => [chart.id, chart])),
        [chartsQuery.data]
    );

    const [renameDashboard, renameState] = useRenameDashboardMutation();
    const [deleteDashboard, deleteState] = useDeleteDashboardMutation();
    const [addDashboardChart, addChartState] = useAddDashboardChartMutation();
    const [addDashboardMetric, addMetricState] = useAddDashboardMetricMutation();
    const [reorderDashboardItems, reorderState] = useReorderDashboardItemsMutation();
    const [removeDashboardItem, removeItemState] = useRemoveDashboardItemMutation();

    useEffect(() => {
        if (!dashboard) {
            dispatch(resetDashboardsWorkspaceDraft());

            return;
        }

        if (dashboard.id === workspaceDraftDashboardId) {
            return;
        }

        dispatch(
            initDashboardsWorkspaceDraft({
                dashboardId: dashboard.id,
                name: dashboard.name,
            })
        );
        setError('');
        setDeleteConfirmationId(null);
    }, [dashboard?.id]);

    useEffect(() => {
        setSelectedChartId(chartsQuery.data?.[0]?.id ?? '');
    }, [chartsQuery.data]);

    useEffect(() => {
        setSelectedMetricDatasetId(datasetsQuery.data?.[0]?.dataset.id ?? '');
    }, [datasetsQuery.data]);

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
            setError(getApiErrorMessage(renameError, 'Unable to rename this dashboard.'));
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
            dispatch(clearWorkspaceMetricForm());
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

        const nextItems = moveDashboardItem(dashboardItems, itemId, direction);
        if (nextItems === dashboardItems) {
            return;
        }

        try {
            await reorderDashboardItems({
                dashboardId: dashboard.id,
                order: getDashboardItemsOrder(nextItems),
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
            dispatch(selectDashboard(null));
            await dashboardsQuery.refetch();
        } catch (deleteError) {
            setError(getApiErrorMessage(deleteError, 'Unable to delete this dashboard.'));
        }
    };

    return (
        <section
            className={styles['panel']}
            data-test-id={dashboardsTestIds.workspace}
            aria-label="Dashboard details"
        >
            {!dashboard && (
                <PanelPlaceholder>Select or create a dashboard.</PanelPlaceholder>
            )}

            {dashboard && (
                <>
                    <WorkspaceHeader
                        dashboard={dashboard}
                        widgetsCount={dashboardItems.length}
                        deleteConfirmationId={deleteConfirmationId}
                        deleteDisabled={deleteState.isLoading}
                        onDelete={() => void handleDeleteDashboard()}
                    />

                    <DashboardNameForm
                        value={draftName}
                        originalName={dashboard.name}
                        saving={renameState.isLoading}
                        refreshing={dashboardQuery.isFetching}
                        onChange={value =>
                            dispatch(setDashboardsWorkspaceDraftName(value))
                        }
                        onRefresh={() => void dashboardQuery.refetch()}
                        onSubmit={handleRenameDashboard}
                    />

                    <AddChartForm
                        charts={chartsQuery.data}
                        value={selectedChartId}
                        disabled={addChartState.isLoading}
                        onChange={setSelectedChartId}
                        onAdd={() => void handleAddChart()}
                    />

                    <AddMetricForm
                        datasets={datasetsQuery.data}
                        datasetId={selectedMetricDatasetId}
                        metricName={metricName}
                        metricExpression={metricExpression}
                        metricFormat={metricFormat}
                        disabled={addMetricState.isLoading}
                        onDatasetChange={setSelectedMetricDatasetId}
                        onNameChange={value => dispatch(setWorkspaceMetricName(value))}
                        onExpressionChange={value =>
                            dispatch(setWorkspaceMetricExpression(value))
                        }
                        onFormatChange={value =>
                            dispatch(setWorkspaceMetricFormat(value))
                        }
                        onSubmit={handleAddMetric}
                    />

                    {error && <StatusMessage tone="error">{error}</StatusMessage>}

                    <DashboardWidgets
                        items={dashboardItems}
                        chartsById={chartsById}
                        reorderLoading={reorderState.isLoading}
                        removing={removeItemState.isLoading}
                        onMoveItem={(itemId, direction) =>
                            void handleMoveItem(itemId, direction)
                        }
                        onRemoveItem={itemId => void handleRemoveItem(itemId)}
                    />
                </>
            )}
        </section>
    );
};
