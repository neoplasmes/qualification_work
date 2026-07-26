import type { DashboardMetricItem } from '@/core/entities/dashboardItem';
import { useCommand } from '@/env/cache/useCommand';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import {
    useDashboardsPageActions,
    useDashboardsPageState,
} from '@/ui/pages/dashboards/model';
import { Button, Divider } from '@qualification-work/design-system';
import { dashboardChartDefaultHeight } from '@qualification-work/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '@/shared/api';
import { StatusMessage } from '@/shared/ui';

import { dashboardsTestIds } from './const';
import {
    useDashboardLayoutController,
    useDashboardsController,
    useDashboardsWorkspaceRouteSync,
} from './model';
import { AddChartModal } from './ui/AddChartModal';
import { DashboardLayoutEditor } from './ui/DashboardLayoutEditor';
import { DashboardMetricModal } from './ui/DashboardMetricModal';
import { DashboardToolbar } from './ui/DashboardToolbar';
import { DashboardWidgets } from './ui/DashboardWidgets';

import styles from './dashboards.page.module.css';

export const DashboardsPage = () => {
    const { initDashboardsWorkspaceDraft, resetDashboardsWorkspaceDraft } =
        useDashboardsPageActions();
    const [selectedChartIds, setSelectedChartIds] = useState<string[]>([]);
    const [activeModal, setActiveModal] = useState<'chart' | 'metric' | 'layout' | null>(
        null
    );
    const [editingMetricItem, setEditingMetricItem] =
        useState<DashboardMetricItem | null>(null);
    const [error, setError] = useState('');

    const selectedDashboardId = useDashboardsPageState(
        state => state.selectedDashboardId
    );
    const rememberedDashboardId = useDashboardsPageState(
        state => state.rememberedDashboardId
    );
    const workspaceDraftDashboardId = useDashboardsPageState(
        state => state.workspaceDraftDashboardId
    );

    const { org, orgId, dashboard, dashboardQuery, selectedListDashboard } =
        useDashboardsController();
    const chartsQuery = useRead(
        useDependencies().listCharts,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );
    const dependencies = useDependencies();
    const datasetsQuery = useRead(
        dependencies.listDatasets,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );

    const isDashboardLoading = Boolean(selectedListDashboard) && !dashboard;
    const layoutController = useDashboardLayoutController({
        orgId,
        dashboardId: dashboard?.id ?? '',
    });
    const dashboardItems = useMemo(() => {
        const layout = new Map(layoutController.layout?.map(item => [item.itemId, item]));

        return (dashboard?.items ?? []).map(item =>
            layout.has(item.id) ? { ...item, layout: layout.get(item.id)! } : item
        );
    }, [dashboard?.items, layoutController.layout]);
    const dashboardTitle = dashboard?.name.trim() || 'Без названия';

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

    const addChartState = useCommand(dependencies.addDashboardChart);
    const removeItemState = useCommand(dependencies.removeDashboardItem);

    useDashboardsWorkspaceRouteSync();

    useEffect(() => {
        if (!dashboard) {
            if (selectedDashboardId || rememberedDashboardId) {
                return;
            }

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
    }, [dashboard?.id, selectedDashboardId, rememberedDashboardId]);

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

        setError('');

        try {
            for (const chartId of selectedChartIds) {
                const outcome = await addChartState.executeOutcome({
                    orgId,
                    dashboardId: dashboard.id,
                    chartId,
                    height: dashboardChartDefaultHeight,
                });
                setSelectedChartIds(current => current.filter(id => id !== chartId));
                if (outcome.syncError) {
                    setError(
                        'График добавлен, но обновление данных не удалось. Обновите данные.'
                    );
                }
            }
            setSelectedChartIds([]);
            setActiveModal(null);
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

    const handleRemoveItem = async (itemId: string) => {
        if (!dashboard) {
            return;
        }

        try {
            const outcome = await removeItemState.executeOutcome({
                orgId,
                dashboardId: dashboard.id,
                itemId,
            });
            if (outcome.syncError) {
                setError(
                    'Виджет удалён, но обновление данных не удалось. Обновите данные.'
                );
            }
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
                    Выберите или создайте дашборд.
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
                    {dashboardQuery.error
                        ? getApiErrorMessage(
                              dashboardQuery.error,
                              'Не удалось загрузить дашборд. Обновите данные.'
                          )
                        : 'Загружаем дашборд...'}
                    {Boolean(dashboardQuery.error) && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                void dependencies.cache
                                    .read(dependencies.getDashboard, {
                                        orgId,
                                        dashboardId: selectedDashboardId!,
                                    })
                                    .catch(() => {});
                            }}
                        >
                            Обновить данные
                        </Button>
                    )}
                </p>
            )}

            {dashboard && (
                <>
                    <DashboardToolbar
                        title={dashboardTitle}
                        onOpen={modal => {
                            setError('');
                            setEditingMetricItem(null);
                            setActiveModal(modal);
                        }}
                    />

                    <Divider />

                    <div
                        className={styles['scroll-area']}
                        data-stack="v"
                        data-gap="sm"
                        data-flex
                    >
                        {error && (
                            <StatusMessage tone="error">
                                {error}
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        void dependencies.cache
                                            .read(dependencies.getDashboard, {
                                                orgId,
                                                dashboardId: dashboard.id,
                                            })
                                            .then(() => setError(''))
                                            .catch(() => {});
                                    }}
                                >
                                    Обновить данные
                                </Button>
                            </StatusMessage>
                        )}
                        {layoutController.error && (
                            <StatusMessage tone="error">
                                {layoutController.error}
                                <Button
                                    variant="ghost"
                                    onClick={() => void layoutController.retry()}
                                >
                                    Повторить
                                </Button>
                            </StatusMessage>
                        )}

                        <DashboardWidgets
                            items={dashboardItems}
                            chartsById={chartsById}
                            datasetColumnsById={datasetColumnsById}
                            datasetNamesById={datasetNamesById}
                            removing={removeItemState.isPending}
                            onLayoutChange={layout => void layoutController.save(layout)}
                            onRemoveItem={itemId => void handleRemoveItem(itemId)}
                            onEditMetric={item => {
                                setEditingMetricItem(item);
                                setActiveModal('metric');
                            }}
                        />
                    </div>

                    {activeModal === 'layout' && (
                        <DashboardLayoutEditor
                            items={dashboardItems}
                            onSave={layout => void layoutController.save(layout)}
                            onClose={() => setActiveModal(null)}
                        />
                    )}
                    {activeModal === 'chart' && (
                        <AddChartModal
                            charts={chartsQuery.data}
                            datasets={datasetsQuery.data}
                            selectedChartIds={selectedChartIds}
                            disabled={addChartState.isPending}
                            error={error}
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
                            onSynchronizedError={setError}
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
