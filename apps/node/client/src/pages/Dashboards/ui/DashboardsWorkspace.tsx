import { skipToken } from '@reduxjs/toolkit/query';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import {
    useAddDashboardChartMutation,
    useAddDashboardMetricMutation,
    useRemoveDashboardItemMutation,
    useReorderDashboardItemsMutation,
} from '@/features/manageDashboards';

import { useListChartsQuery } from '@/entities/chart';
import { useGetDashboardQuery, useListDashboardsQuery } from '@/entities/dashboard';
import { useListDatasetsQuery } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { getSelected } from '@/shared/lib/getSelected';
import { useHasOverflow } from '@/shared/lib/useHasOverflow';
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
import {
    AddChartModal,
    AddMetricModal,
    DashboardWidgets,
    DashboardWorkspaceHeading,
} from './ui';

import styles from './DashboardsPage.module.scss';

export const DashboardsWorkspace = () => {
    const dispatch = useDispatch();
    const workspaceRef = useRef<HTMLElement>(null);
    const [selectedChartId, setSelectedChartId] = useState('');
    const [selectedMetricDatasetId, setSelectedMetricDatasetId] = useState('');
    const [activeModal, setActiveModal] = useState<'chart' | 'metric' | null>(null);
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

    const [addDashboardChart, addChartState] = useAddDashboardChartMutation();
    const [addDashboardMetric, addMetricState] = useAddDashboardMetricMutation();
    const [reorderDashboardItems, reorderState] = useReorderDashboardItemsMutation();
    const [removeDashboardItem, removeItemState] = useRemoveDashboardItemMutation();

    useHasOverflow(workspaceRef);

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
        setActiveModal(null);
    }, [dashboard?.id]);

    useEffect(
        () => setSelectedChartId(chartsQuery.data?.[0]?.id ?? ''),
        [chartsQuery.data]
    );

    useEffect(
        () => setSelectedMetricDatasetId(datasetsQuery.data?.[0]?.dataset.id ?? ''),
        [datasetsQuery.data]
    );

    const handleMetricNameChange = useCallback(
        (value: string) => {
            dispatch(setWorkspaceMetricName(value));
        },
        [dispatch]
    );
    const handleMetricExpressionChange = useCallback(
        (value: string) => {
            dispatch(setWorkspaceMetricExpression(value));
        },
        [dispatch]
    );
    const handleMetricFormatChange = useCallback(
        (value: typeof metricFormat) => {
            dispatch(setWorkspaceMetricFormat(value));
        },
        [dispatch]
    );

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
            setActiveModal(null);
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
            setActiveModal(null);
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
            ref={workspaceRef}
            className={styles['panel']}
            data-stack="v"
            data-gap="md"
            data-flex
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
                        onAddMetric={() => setActiveModal('metric')}
                        onAddChart={() => setActiveModal('chart')}
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

                    {activeModal === 'chart' && (
                        <AddChartModal
                            charts={chartsQuery.data}
                            value={selectedChartId}
                            disabled={addChartState.isLoading}
                            onChange={setSelectedChartId}
                            onAdd={() => void handleAddChart()}
                            onClose={() => setActiveModal(null)}
                        />
                    )}

                    {activeModal === 'metric' && (
                        <AddMetricModal
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
                            onClose={() => setActiveModal(null)}
                        />
                    )}
                </>
            )}
        </section>
    );
};
