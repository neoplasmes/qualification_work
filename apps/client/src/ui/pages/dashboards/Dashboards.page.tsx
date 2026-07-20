import {
    useDashboardsPageActions,
    useDashboardsPageState,
} from '@/ui/pages/dashboards/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import { Button, Divider } from '@qualification-work/design-system';
import {
    dashboardChartDefaultHeight,
    type DashboardItemLayoutInput,
} from '@qualification-work/types';
import { skipToken } from '@reduxjs/toolkit/query';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    useAddDashboardChartMutation,
    useRemoveDashboardItemMutation,
    useUpdateDashboardLayoutMutation,
} from '@/features/manageDashboards';

import { useListChartsQuery } from '@/entities/chart';
import {
    useGetDashboardQuery,
    useListDashboardsQuery,
    type DashboardMetricItem,
} from '@/entities/dashboard';
import { useListDatasetsQuery } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { getSelected } from '@/shared/lib/getSelected';
import { StatusMessage } from '@/shared/ui';

import { dashboardsTestIds } from './const';
import { useDashboardsWorkspaceRouteSync } from './model';
import { AddChartModal } from './ui/AddChartModal';
import { DashboardMetricModal } from './ui/DashboardMetricModal';
import { DashboardWidgets } from './ui/DashboardWidgets';

import styles from './dashboards.page.module.css';

export const DashboardsPage = () => {
    const { initDashboardsWorkspaceDraft, resetDashboardsWorkspaceDraft } =
        useDashboardsPageActions();
    const [selectedChartIds, setSelectedChartIds] = useState<string[]>([]);
    const [activeModal, setActiveModal] = useState<'chart' | 'metric' | null>(null);
    const [editingMetricItem, setEditingMetricItem] =
        useState<DashboardMetricItem | null>(null);
    const [error, setError] = useState('');

    const selectedDashboardId = useDashboardsPageState(
        state => state.selectedDashboardId
    );
    const workspaceDraftDashboardId = useDashboardsPageState(
        state => state.workspaceDraftDashboardId
    );

    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);

    const selectedListDashboard = useMemo(() => {
        if (selectedDashboardId === null) {
            return undefined;
        }

        return getSelected(dashboardsQuery.data, selectedDashboardId);
    }, [dashboardsQuery.data, selectedDashboardId]);
    const dashboardQuery = useGetDashboardQuery(selectedListDashboard?.id ?? skipToken);
    const dashboard = dashboardQuery.currentData;
    const isDashboardLoading = Boolean(selectedListDashboard) && !dashboard;
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

    useDashboardsWorkspaceRouteSync();

    useEffect(() => {
        if (isDashboardLoading) {
            return;
        }

        if (!dashboard) {
            resetDashboardsWorkspaceDraft();
            setEditingMetricItem(null);

            return;
        }

        if (dashboard.id === workspaceDraftDashboardId) {
            return;
        }

        initDashboardsWorkspaceDraft({
            dashboardId: dashboard.id,
            name: dashboard.name,
        });
        setError('');
        setEditingMetricItem(null);
        setActiveModal(null);
    }, [dashboard?.id, isDashboardLoading]);

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
            className={styles['panel']}
            data-stack="v"
            data-gap="sm"
            data-flex
            data-test-id={dashboardsTestIds.workspace}
            aria-label="Dashboard details"
        >
            {!selectedListDashboard && (
                <p
                    className={styles['placeholder']}
                    data-stack="h"
                    data-align="center"
                    data-justify="center"
                    data-flex
                >
                    Select or create a dashboard.
                </p>
            )}

            {isDashboardLoading && (
                <p
                    className={styles['placeholder']}
                    data-stack="h"
                    data-align="center"
                    data-justify="center"
                    data-flex
                >
                    Loading dashboard...
                </p>
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
                                size="regular"
                                data-test-id={dashboardsTestIds.openAddMetricModalButton}
                                onClick={() => {
                                    setEditingMetricItem(null);
                                    setActiveModal('metric');
                                }}
                            >
                                <Plus size={16} strokeWidth={2.6} />
                                Metric
                            </Button>
                            <Button
                                size="regular"
                                data-gap="xs"
                                data-test-id={dashboardsTestIds.openAddChartModalButton}
                                onClick={() => setActiveModal('chart')}
                            >
                                <Plus size={16} strokeWidth={2.6} />
                                Chart
                            </Button>
                        </div>
                    </div>

                    <Divider />

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
                                setEditingMetricItem(item);
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
                        <DashboardMetricModal
                            dashboard={dashboard}
                            datasets={datasetsQuery.data}
                            item={editingMetricItem}
                            refetchDashboard={dashboardQuery.refetch}
                            refetchDashboards={dashboardsQuery.refetch}
                            onClose={() => {
                                setEditingMetricItem(null);
                                setActiveModal(null);
                            }}
                        />
                    )}
                </>
            )}
        </section>
    );
};
