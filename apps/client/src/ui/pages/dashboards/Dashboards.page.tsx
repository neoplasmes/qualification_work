import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { getApiErrorMessage } from '@/ui/errors/apiError';
import {
    useDashboardsPageActions,
    useDashboardsPageState,
} from '@/ui/pages/dashboards/model';
import { Button, Divider } from '@qualification-work/design-system';
import { useEffect, useMemo } from 'react';

import { StatusMessage } from '@/shared/ui';

import { dashboardsTestIds } from './const';
import {
    useDashboardInteractions,
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

    const interactions = useDashboardInteractions(orgId, selectedDashboardId);
    const {
        selectedChartIds,
        setSelectedChartIds,
        activeModal,
        editingMetricItem,
        error,
    } = interactions;

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

    useDashboardsWorkspaceRouteSync();

    useEffect(() => {
        if (!dashboard) {
            if (selectedDashboardId || rememberedDashboardId) {
                return;
            }

            resetDashboardsWorkspaceDraft();

            return;
        }

        if (dashboard.id === workspaceDraftDashboardId) {
            return;
        }

        initDashboardsWorkspaceDraft({
            dashboardId: dashboard.id,
            name: dashboard.name,
        });
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

    return (
        <section
            className={styles['panel']}
            data-stack="v"
            data-gap="sm"
            data-flex
            data-test-id={dashboardsTestIds.workspace}
            aria-label="Сведения о дашборде"
        >
            {error && (
                <StatusMessage tone="error">
                    {error}
                    <Button variant="ghost" onClick={() => void interactions.refresh()}>
                        Обновить данные
                    </Button>
                </StatusMessage>
            )}
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
                        onOpen={interactions.openModal}
                    />

                    <Divider />

                    <div
                        className={styles['scroll-area']}
                        data-stack="v"
                        data-gap="sm"
                        data-flex
                    >
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
                            removing={interactions.removing}
                            onLayoutChange={layout => void layoutController.save(layout)}
                            onRemoveItem={itemId => void interactions.removeItem(itemId)}
                            onEditMetric={item => interactions.openModal('metric', item)}
                        />
                    </div>

                    {activeModal === 'layout' && (
                        <DashboardLayoutEditor
                            items={dashboardItems}
                            onSave={layout => void layoutController.save(layout)}
                            onClose={interactions.closeModal}
                        />
                    )}
                    {activeModal === 'chart' && (
                        <AddChartModal
                            charts={chartsQuery.data}
                            datasets={datasetsQuery.data}
                            selectedChartIds={selectedChartIds}
                            disabled={interactions.adding}
                            error={error}
                            onToggleChart={id =>
                                setSelectedChartIds(current =>
                                    current.includes(id)
                                        ? current.filter(selected => selected !== id)
                                        : [...current, id]
                                )
                            }
                            onRemoveChart={id =>
                                setSelectedChartIds(current =>
                                    current.filter(selected => selected !== id)
                                )
                            }
                            onClearSelection={() => setSelectedChartIds([])}
                            onAdd={() => void interactions.addCharts()}
                            onClose={interactions.closeModal}
                        />
                    )}

                    {activeModal === 'metric' && (
                        <DashboardMetricModal
                            dashboard={dashboard}
                            datasets={datasetsQuery.data}
                            item={editingMetricItem}
                            onSynchronizedError={interactions.setFeedback}
                            onClose={interactions.closeModal}
                        />
                    )}
                </>
            )}
        </section>
    );
};
