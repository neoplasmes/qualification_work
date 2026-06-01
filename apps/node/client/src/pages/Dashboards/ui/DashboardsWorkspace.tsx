import {
    dashboardChartDefaultHeight,
    type DashboardItemLayoutInput,
} from '@qualification-work/types';
import { skipToken } from '@reduxjs/toolkit/query';
import { Plus, Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useHasOverflow } from '@/shared/lib/useHasOverflow';
import { Button, Modal, PanelPlaceholder, Separator, StatusMessage } from '@/shared/ui';

import { dashboardsTestIds } from '../const';
import {
    initDashboardsWorkspaceDraft,
    resetDashboardsWorkspaceDraft,
    selectSelectedDashboardId,
    selectWorkspaceDraftDashboardId,
} from '../model';
import {
    getResolvedDashboard,
    getSelectedDashboard,
    useDashboardMetricModal,
    useDashboardsWorkspaceRouteSync,
} from './lib';
import { AddChartModal, AddMetricForm, DashboardWidgets } from './ui';

import styles from './DashboardsPage.module.scss';

const dashboardMetricFormId = 'dashboard-metric-form';

export const DashboardsWorkspace = () => {
    const dispatch = useDispatch();
    const workspaceRef = useRef<HTMLElement>(null);
    const [selectedChartIds, setSelectedChartIds] = useState<string[]>([]);
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
        () => getSelectedDashboard(dashboardsQuery.data, selectedDashboardId),
        [dashboardsQuery.data, selectedDashboardId]
    );
    const dashboardQuery = useGetDashboardQuery(selectedListDashboard?.id ?? skipToken);
    const dashboard = getResolvedDashboard(dashboardQuery.data, selectedListDashboard);
    const dashboardItems = dashboard?.items ?? [];
    const dashboardTitle = dashboard?.name.trim() || 'Untitled dashboard';

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
    const datasetNamesById = useMemo(
        () =>
            new Map(
                (datasetsQuery.data ?? []).map(dataset => [
                    dataset.dataset.id,
                    dataset.dataset.name,
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
    const isMetricSaveDisabled =
        !metricModal.datasetId || !metricModal.expression.trim() || metricModal.disabled;
    const metricModalActions = (
        <Button
            type="submit"
            form={dashboardMetricFormId}
            data-px="sm"
            data-py="xs"
            data-pr="none"
            data-test-id={dashboardsTestIds.addMetricButton}
            disabled={isMetricSaveDisabled}
            isLoading={metricModal.disabled}
        >
            <Save size={18} />
            Save
        </Button>
    );

    useHasOverflow(workspaceRef);
    useDashboardsWorkspaceRouteSync(selectedDashboardId);

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

    useEffect(() => {
        if (!chartsQuery.data) {
            return;
        }

        const availableChartIds = new Set(chartsQuery.data.map(chart => chart.id));
        setSelectedChartIds(current => {
            const next = current.filter(chartId => availableChartIds.has(chartId));

            return next.length === current.length ? current : next;
        });
    }, [chartsQuery.data]);

    const handleAddChart = async () => {
        if (!dashboard || selectedChartIds.length === 0) {
            return;
        }

        try {
            for (const chartId of selectedChartIds) {
                await addDashboardChart({
                    dashboardId: dashboard.id,
                    chartId,
                    height: dashboardChartDefaultHeight,
                }).unwrap();
            }
            setSelectedChartIds([]);
            setActiveModal(null);
            await dashboardQuery.refetch();
            await dashboardsQuery.refetch();
        } catch (addError) {
            setError(getApiErrorMessage(addError, 'Unable to add selected charts.'));
        }
    };

    const toggleSelectedChart = useCallback((chartId: string) => {
        setSelectedChartIds(current =>
            current.includes(chartId)
                ? current.filter(selectedChartId => selectedChartId !== chartId)
                : [...current, chartId]
        );
    }, []);

    const removeSelectedChart = useCallback((chartId: string) => {
        setSelectedChartIds(current =>
            current.filter(selectedChartId => selectedChartId !== chartId)
        );
    }, []);

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
            data-gap="sm"
            data-flex
            data-test-id={dashboardsTestIds.workspace}
            aria-label="Dashboard details"
        >
            {!dashboard && (
                <PanelPlaceholder>Select or create a dashboard.</PanelPlaceholder>
            )}

            {dashboard && (
                <>
                    <div
                        className={styles['top-line-block']}
                        data-stack="h"
                        data-justify="between"
                        data-align="center"
                        data-gap="sm"
                    >
                        <h2 className={styles['title']}>{dashboardTitle}</h2>

                        <div data-stack="h" data-gap="sm">
                            <Button
                                size="sm"
                                data-test-id={dashboardsTestIds.openAddMetricModalButton}
                                onClick={() => {
                                    metricModal.openAdd();
                                    setActiveModal('metric');
                                }}
                            >
                                <Plus size={16} strokeWidth={2.6} />
                                Metric
                            </Button>
                            <Button
                                size="sm"
                                data-gap="xs"
                                data-test-id={dashboardsTestIds.openAddChartModalButton}
                                onClick={() => setActiveModal('chart')}
                            >
                                <Plus size={16} strokeWidth={2.6} />
                                Chart
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div
                        className={styles['scroll-area']}
                        data-stack="v"
                        data-gap="sm"
                        data-flex
                    >
                        {error && <StatusMessage tone="error">{error}</StatusMessage>}

                        <DashboardWidgets
                            items={dashboardItems}
                            chartsById={chartsById}
                            datasetColumnsById={datasetColumnsById}
                            datasetNamesById={datasetNamesById}
                            removing={removeItemState.isLoading}
                            onLayoutChange={layout => void handleLayoutChange(layout)}
                            onRemoveItem={itemId => void handleRemoveItem(itemId)}
                            onEditMetric={item => {
                                metricModal.openEdit(item);
                                setActiveModal('metric');
                            }}
                        />
                    </div>

                    {activeModal === 'chart' && (
                        <AddChartModal
                            charts={chartsQuery.data}
                            datasets={datasetsQuery.data}
                            selectedChartIds={selectedChartIds}
                            disabled={addChartState.isLoading}
                            onToggleChart={toggleSelectedChart}
                            onRemoveChart={removeSelectedChart}
                            onClearSelection={() => setSelectedChartIds([])}
                            onAdd={() => void handleAddChart()}
                            onClose={() => setActiveModal(null)}
                        />
                    )}

                    {activeModal === 'metric' && (
                        <Modal
                            title={metricModal.editing ? 'Edit metric' : 'Add metric'}
                            actions={metricModalActions}
                            testId={dashboardsTestIds.addMetricModal}
                            size="md"
                            padding="md"
                            height={720}
                            onClose={() => {
                                metricModal.close();
                                setActiveModal(null);
                            }}
                        >
                            <AddMetricForm
                                formId={dashboardMetricFormId}
                                datasets={datasetsQuery.data}
                                datasetId={metricModal.datasetId}
                                metricName={metricModal.name}
                                metricExpression={metricModal.expression}
                                metricFormat={metricModal.format}
                                metricValueMultiplier={metricModal.valueMultiplier}
                                config={metricModal.config}
                                error={metricModal.error}
                                editing={metricModal.editing}
                                onDatasetChange={metricModal.setDatasetId}
                                onNameChange={metricModal.setName}
                                onExpressionChange={metricModal.setExpression}
                                onFormatChange={metricModal.setFormat}
                                onValueMultiplierChange={metricModal.setValueMultiplier}
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
