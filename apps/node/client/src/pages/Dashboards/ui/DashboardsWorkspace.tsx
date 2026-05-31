import {
    dashboardChartDefaultHeight,
    type DashboardItemLayoutInput,
} from '@qualification-work/types';
import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import {
    useAddDashboardChartMutation,
    useRemoveDashboardItemMutation,
    useUpdateDashboardLayoutMutation,
} from '@/features/manageDashboards';

import { useListChartsQuery } from '@/entities/chart';
import { useGetDashboardQuery, useListDashboardsQuery } from '@/entities/dashboard';
import { useListDatasetsQuery } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { getSelected } from '@/shared/lib/getSelected';
import { useHasOverflow } from '@/shared/lib/useHasOverflow';
import { Modal, PanelPlaceholder, StatusMessage } from '@/shared/ui';

import { dashboardsTestIds } from '../const';
import {
    initDashboardsWorkspaceDraft,
    resetDashboardsWorkspaceDraft,
    selectSelectedDashboardId,
    selectWorkspaceDraftDashboardId,
} from '../model';
import { useDashboardMetricModal } from './lib';
import {
    AddChartModal,
    AddMetricForm,
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
    const [updateDashboardLayout] = useUpdateDashboardLayoutMutation();
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
                height: dashboardChartDefaultHeight,
            }).unwrap();
            setActiveModal(null);
            await dashboardQuery.refetch();
            await dashboardsQuery.refetch();
        } catch (addError) {
            setError(getApiErrorMessage(addError, 'Unable to add this chart.'));
        }
    };

    const handleLayoutChange = async (layout: DashboardItemLayoutInput[]) => {
        if (!dashboard || layout.length === 0) {
            return;
        }

        try {
            await updateDashboardLayout({
                dashboardId: dashboard.id,
                layout,
            }).unwrap();
            await dashboardQuery.refetch();
        } catch (layoutError) {
            setError(
                getApiErrorMessage(layoutError, 'Unable to save the dashboard layout.')
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
                        removing={removeItemState.isLoading}
                        onLayoutChange={layout => void handleLayoutChange(layout)}
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
                        <Modal
                            title={metricModal.editing ? 'Edit metric' : 'Add metric'}
                            testId={dashboardsTestIds.addMetricModal}
                            size="md"
                            onClose={() => {
                                metricModal.close();
                                setActiveModal(null);
                            }}
                        >
                            <AddMetricForm
                                datasets={datasetsQuery.data}
                                datasetId={metricModal.datasetId}
                                metricName={metricModal.name}
                                metricExpression={metricModal.expression}
                                metricFormat={metricModal.format}
                                config={metricModal.config}
                                error={metricModal.error}
                                disabled={metricModal.disabled}
                                editing={metricModal.editing}
                                onDatasetChange={metricModal.setDatasetId}
                                onNameChange={metricModal.setName}
                                onExpressionChange={metricModal.setExpression}
                                onFormatChange={metricModal.setFormat}
                                onConfigChange={metricModal.setConfig}
                                onSubmit={event => {
                                    void metricModal.submit(event).then(saved => {
                                        if (saved) {
                                            setActiveModal(null);
                                        }
                                    });
                                }}
                            />
                        </Modal>
                    )}
                </>
            )}
        </section>
    );
};
