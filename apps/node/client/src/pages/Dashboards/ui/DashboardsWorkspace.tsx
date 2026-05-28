import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import {
    useAddDashboardChartMutation,
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
    initDashboardsWorkspaceDraft,
    resetDashboardsWorkspaceDraft,
    selectSelectedDashboardId,
    selectWorkspaceDraftDashboardId,
} from '../model';
import { useDashboardMetricModal } from './lib';
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
    const [activeModal, setActiveModal] = useState<'chart' | 'metric' | null>(null);
    const [error, setError] = useState('');

    const selectedDashboardId = useSelector(selectSelectedDashboardId);
    const workspaceDraftDashboardId = useSelector(selectWorkspaceDraftDashboardId);

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
    const datasetColumnsById = useMemo(
        () =>
            new Map(
                (datasetsQuery.data ?? []).map(dataset => [
                    dataset.dataset.id,
                    dataset.columns,
                ])
            ),
        [datasetsQuery.data]
    );

    const [addDashboardChart, addChartState] = useAddDashboardChartMutation();
    const [reorderDashboardItems, reorderState] = useReorderDashboardItemsMutation();
    const [removeDashboardItem, removeItemState] = useRemoveDashboardItemMutation();
    const metricModal = useDashboardMetricModal({
        dashboard,
        datasets: datasetsQuery.data,
        refetchDashboard: dashboardQuery.refetch,
        refetchDashboards: dashboardsQuery.refetch,
    });

    useHasOverflow(workspaceRef);

    useEffect(() => {
        if (!dashboard) {
            dispatch(resetDashboardsWorkspaceDraft());
            metricModal.close();

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
        metricModal.close();
        setActiveModal(null);
    }, [dashboard?.id]);

    useEffect(
        () => setSelectedChartId(chartsQuery.data?.[0]?.id ?? ''),
        [chartsQuery.data]
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
                        onAddMetric={() => {
                            metricModal.openAdd();
                            setActiveModal('metric');
                        }}
                        onAddChart={() => setActiveModal('chart')}
                    />

                    {error && <StatusMessage tone="error">{error}</StatusMessage>}

                    <DashboardWidgets
                        items={dashboardItems}
                        chartsById={chartsById}
                        datasetColumnsById={datasetColumnsById}
                        reorderLoading={reorderState.isLoading}
                        removing={removeItemState.isLoading}
                        onMoveItem={(itemId, direction) =>
                            void handleMoveItem(itemId, direction)
                        }
                        onRemoveItem={itemId => void handleRemoveItem(itemId)}
                        onEditMetric={item => {
                            metricModal.openEdit(item);
                            setActiveModal('metric');
                        }}
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
                            datasetId={metricModal.datasetId}
                            metricName={metricModal.name}
                            metricExpression={metricModal.expression}
                            metricFormat={metricModal.format}
                            error={metricModal.error}
                            disabled={metricModal.disabled}
                            editing={metricModal.editing}
                            onDatasetChange={metricModal.setDatasetId}
                            onNameChange={metricModal.setName}
                            onExpressionChange={metricModal.setExpression}
                            onFormatChange={metricModal.setFormat}
                            onSubmit={event => {
                                void metricModal.submit(event).then(saved => {
                                    if (saved) {
                                        setActiveModal(null);
                                    }
                                });
                            }}
                            onClose={() => {
                                metricModal.close();
                                setActiveModal(null);
                            }}
                        />
                    )}
                </>
            )}
        </section>
    );
};
