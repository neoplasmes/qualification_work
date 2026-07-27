import type { DashboardMetricItem } from '@/core/entities/dashboardItem';
import { useCommand } from '@/env/cache/useCommand';
import { useDependencies } from '@/ui/di/dependencies';
import { getApiErrorMessage } from '@/ui/errors/apiError';
import { dashboardChartDefaultHeight } from '@qualification-work/types';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router';

type Modal = 'chart' | 'metric' | 'layout';

export function useDashboardInteractions(orgId: string, dashboardId: string | null) {
    const dependencies = useDependencies();
    const location = useLocation();
    const view = useMemo(() => ({ live: true }), [orgId, dashboardId, location.key]);
    const modalGeneration = useRef(0);
    const feedbackGeneration = useRef(0);
    const [selectedChartIds, setSelectedChartIds] = useState<string[]>([]);
    const [activeModal, setActiveModal] = useState<Modal | null>(null);
    const [editingMetricItem, setEditingMetricItem] =
        useState<DashboardMetricItem | null>(null);
    const [error, setError] = useState('');

    const addChartState = useCommand(dependencies.addDashboardChart);
    const removeItemState = useCommand(dependencies.removeDashboardItem);

    useLayoutEffect(() => {
        view.live = true;
        modalGeneration.current++;
        feedbackGeneration.current++;
        setActiveModal(null);
        setEditingMetricItem(null);
        setSelectedChartIds([]);
        setError('');

        return () => {
            view.live = false;
            modalGeneration.current++;
            feedbackGeneration.current++;
        };
    }, [view]);

    const setFeedback = useCallback(
        (message: string) => {
            if (!view.live) {
                return;
            }
            feedbackGeneration.current++;
            setError(message);
        },
        [view]
    );

    const openModal = (modal: Modal, item: DashboardMetricItem | null = null) => {
        modalGeneration.current++;
        setFeedback('');
        setSelectedChartIds([]);
        setEditingMetricItem(item);
        setActiveModal(modal);
    };

    const closeModal = () => {
        modalGeneration.current++;
        setActiveModal(null);
        setEditingMetricItem(null);
        setSelectedChartIds([]);
    };

    const addCharts = async () => {
        if (!dashboardId || selectedChartIds.length === 0) {
            return;
        }
        const version = modalGeneration.current;
        setFeedback('');
        try {
            for (const chartId of selectedChartIds) {
                const outcome = await addChartState.executeOutcome({
                    orgId,
                    dashboardId,
                    chartId,
                    height: dashboardChartDefaultHeight,
                });
                if (view.live && version === modalGeneration.current) {
                    setSelectedChartIds(current => current.filter(id => id !== chartId));
                    if (outcome.syncError) {
                        setFeedback(
                            'График добавлен, но обновление данных не удалось. Обновите данные.'
                        );
                    }
                }
            }
            if (view.live && version === modalGeneration.current) {
                closeModal();
            }
        } catch (cause) {
            if (view.live && version === modalGeneration.current) {
                setFeedback(
                    getApiErrorMessage(cause, 'Не удалось добавить выбранные графики.')
                );
            }
        }
    };

    const removeItem = async (itemId: string) => {
        if (!dashboardId) {
            return;
        }
        try {
            const outcome = await removeItemState.executeOutcome({
                orgId,
                dashboardId,
                itemId,
            });
            if (view.live && outcome.syncError) {
                setFeedback(
                    'Виджет удалён, но обновление данных не удалось. Обновите данные.'
                );
            }
        } catch (cause) {
            if (view.live) {
                setFeedback(getApiErrorMessage(cause, 'Не удалось удалить виджет.'));
            }
        }
    };

    const refresh = async () => {
        if (!dashboardId) {
            return;
        }
        const version = feedbackGeneration.current;
        try {
            await Promise.all([
                dependencies.cache.read(dependencies.listDashboards, { orgId }),
                dependencies.cache.read(dependencies.getDashboard, {
                    orgId,
                    dashboardId,
                }),
            ]);
            if (view.live && version === feedbackGeneration.current) {
                setFeedback('');
            }
        } catch {
            // keep the confirmed receipt available for another read-only retry
        }
    };

    return {
        activeModal,
        editingMetricItem,
        selectedChartIds,
        setSelectedChartIds,
        error,
        setFeedback,
        openModal,
        closeModal,
        addCharts,
        removeItem,
        refresh,
        adding: addChartState.isPending,
        removing: removeItemState.isPending,
    };
}
