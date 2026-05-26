import { skipToken } from '@reduxjs/toolkit/query';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
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
import { useGetDashboardQuery, useListDashboardsQuery } from '@/entities/dashboard';
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
    selectSelectedDashboardId,
    selectWorkspaceDraftDashboardId,
    selectWorkspaceMetricExpression,
    selectWorkspaceMetricFormat,
    selectWorkspaceMetricName,
    setWorkspaceMetricExpression,
    setWorkspaceMetricFormat,
    setWorkspaceMetricName,
} from '../model';
import { AddChartForm } from './components/AddChartForm';
import { AddMetricForm } from './components/AddMetricForm';
import { DashboardWidgets } from './components/DashboardWidgets';
import { DashboardWorkspaceHeading } from './components/DashboardWorkspaceHeading';

import styles from './DashboardsPage.module.scss';

export const DashboardsWorkspace = () => {
    const dispatch = useDispatch();
    const [selectedChartId, setSelectedChartId] = useState('');
    const [selectedMetricDatasetId, setSelectedMetricDatasetId] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');

    const selectedDashboardId = useSelector(selectSelectedDashboardId);
    const workspaceDraftDashboardId = useSelector(selectWorkspaceDraftDashboardId);
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
        setIsEditing(false);
    }, [dashboard?.id]);

    useEffect(() => {
        setSelectedChartId(chartsQuery.data?.[0]?.id ?? '');
    }, [chartsQuery.data]);

    useEffect(() => {
        setSelectedMetricDatasetId(datasetsQuery.data?.[0]?.dataset.id ?? '');
    }, [datasetsQuery.data]);

    const handleMetricNameChange = useCallback(
        (value: string) => dispatch(setWorkspaceMetricName(value)),
        [dispatch]
    );
    const handleMetricExpressionChange = useCallback(
        (value: string) => dispatch(setWorkspaceMetricExpression(value)),
        [dispatch]
    );
    const handleMetricFormatChange = useCallback(
        (value: typeof metricFormat) => dispatch(setWorkspaceMetricFormat(value)),
        [dispatch]
    );

    const handleRenameDashboard = async (name: string) => {
        if (!dashboard) {
            return;
        }

        try {
            setError('');
            await renameDashboard({ dashboardId: dashboard.id, name }).unwrap();
            await dashboardsQuery.refetch();
            await dashboardQuery.refetch();
        } catch (renameError) {
            const message = getApiErrorMessage(
                renameError,
                'Unable to rename this dashboard.'
            );
            setError(message);

            throw new Error(message);
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
            await dashboardsQuery.refetch();
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
            await dashboardsQuery.refetch();
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
            await dashboardsQuery.refetch();
        } catch (removeError) {
            setError(getApiErrorMessage(removeError, 'Unable to remove this widget.'));
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
                    <DashboardWorkspaceHeading
                        name={dashboard.name}
                        widgetsCount={dashboardItems.length}
                        editing={isEditing}
                        renaming={renameState.isLoading}
                        onRename={handleRenameDashboard}
                        onEditingChange={setIsEditing}
                    />

                    {error && <StatusMessage tone="error">{error}</StatusMessage>}

                    {!isEditing && (
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
                    )}

                    {isEditing && (
                        <>
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
                                onNameChange={handleMetricNameChange}
                                onExpressionChange={handleMetricExpressionChange}
                                onFormatChange={handleMetricFormatChange}
                                onSubmit={handleAddMetric}
                            />
                        </>
                    )}
                </>
            )}
        </section>
    );
};
