import type { Dashboard } from '@/core/entities/dashboard';
import type { DashboardMetricItem } from '@/core/entities/dashboardItem';
import { useCommand } from '@/env/cache/useCommand';
import { useDependencies } from '@/ui/di/dependencies';
import type {
    MetricBuilderDraft,
    MetricBuilderOutput,
} from '@/ui/pages/dashboards/ui/MetricBuilder';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type SubmitEvent,
} from 'react';
import { useStore } from 'zustand';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { getApiErrorMessage } from '@/shared/api';

import { createMetricFormStore, type WorkspaceMetricForm } from './metricForm.store';

type UseDashboardMetricModalParams = {
    dashboard: Dashboard | null | undefined;
    datasets: DatasetMetadata[] | undefined;
    onSynchronizedError: (message: string) => void;
};

const getFirstDatasetId = (datasets: DatasetMetadata[] | undefined) =>
    datasets?.[0]?.dataset.id ?? '';

const getLegacyMetricFormat = (format: DashboardMetricItem['format']) => {
    if (format === 'currency') {
        return '₽';
    }
    if (format === 'percent') {
        return '%';
    }
    if (format === 'number') {
        return '';
    }

    return format;
};

const itemToForm = (item: DashboardMetricItem): WorkspaceMetricForm => ({
    name: item.name,
    expression: item.expression,
    format: getLegacyMetricFormat(item.format),
    valueMultiplier: String(
        item.valueMultiplier ?? (item.format === 'percent' ? 100 : 1)
    ),
    target: item.target === null ? '' : String(item.target),
    targetDirection: item.targetDirection ?? 'higher',
    showTrend: item.showTrend,
    timeColumn: item.timeColumn ?? '',
    timeBucket: item.timeBucket ?? '',
});

export const useDashboardMetricModal = ({
    dashboard,
    datasets,
    onSynchronizedError,
}: UseDashboardMetricModalParams) => {
    const generation = useRef(0);
    useLayoutEffect(
        () => () => {
            generation.current++;
        },
        [dashboard?.orgId, dashboard?.id]
    );
    const [store] = useState(createMetricFormStore);
    const { clearWorkspaceMetricForm, setWorkspaceMetricForm } = store.getState();
    const [selectedDatasetId, setSelectedDatasetId] = useState('');
    const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
    const [metricBuilderOutput, setMetricBuilderOutput] =
        useState<MetricBuilderOutput | null>(null);
    const [error, setError] = useState('');

    const name = useStore(store, state => state.workspaceMetricName);
    const expression = useStore(store, state => state.workspaceMetricExpression);
    const format = useStore(store, state => state.workspaceMetricFormat);
    const valueMultiplier = useStore(
        store,
        state => state.workspaceMetricValueMultiplier
    );
    const target = useStore(store, state => state.workspaceMetricTarget);
    const targetDirection = useStore(
        store,
        state => state.workspaceMetricTargetDirection
    );
    const showTrend = useStore(store, state => state.workspaceMetricShowTrend);
    const timeColumn = useStore(store, state => state.workspaceMetricTimeColumn);
    const timeBucket = useStore(store, state => state.workspaceMetricTimeBucket);

    const dependencies = useDependencies();
    const addState = useCommand(dependencies.addDashboardMetric);
    const updateState = useCommand(dependencies.updateDashboardMetric);

    useEffect(() => {
        setSelectedDatasetId(current => {
            const hasCurrent = datasets?.some(item => item.dataset.id === current);

            return hasCurrent ? current : getFirstDatasetId(datasets);
        });
    }, [datasets]);

    const value = useMemo<MetricBuilderDraft>(
        () => ({
            datasetId: selectedDatasetId,
            name,
            expression,
            format,
            valueMultiplier,
            target,
            targetDirection,
            showTrend,
            timeColumn,
            timeBucket,
        }),
        [
            expression,
            format,
            name,
            selectedDatasetId,
            showTrend,
            target,
            targetDirection,
            timeBucket,
            timeColumn,
            valueMultiplier,
        ]
    );

    const setValue = useCallback(
        (next: MetricBuilderDraft) => {
            setSelectedDatasetId(next.datasetId);
            setWorkspaceMetricForm({
                name: next.name,
                expression: next.expression,
                format: next.format,
                valueMultiplier: next.valueMultiplier,
                target: next.target,
                targetDirection: next.targetDirection,
                showTrend: next.showTrend,
                timeColumn: next.timeColumn,
                timeBucket: next.timeBucket,
            });
        },
        [setWorkspaceMetricForm, clearWorkspaceMetricForm]
    );

    const openAdd = useCallback(() => {
        generation.current++;
        setEditingMetricId(null);
        setMetricBuilderOutput(null);
        setError('');
        setSelectedDatasetId(getFirstDatasetId(datasets));
        clearWorkspaceMetricForm();
    }, [datasets, clearWorkspaceMetricForm]);

    const openEdit = useCallback(
        (item: DashboardMetricItem) => {
            generation.current++;
            setEditingMetricId(item.id);
            setMetricBuilderOutput({ datasetId: item.datasetId, ...itemToForm(item) });
            setError('');
            setSelectedDatasetId(item.datasetId);
            setWorkspaceMetricForm(itemToForm(item));
        },
        [setWorkspaceMetricForm, clearWorkspaceMetricForm]
    );

    const close = useCallback(() => {
        generation.current++;
        setEditingMetricId(null);
        setMetricBuilderOutput(null);
        setError('');
        clearWorkspaceMetricForm();
    }, [setWorkspaceMetricForm, clearWorkspaceMetricForm]);

    const submit = useCallback(
        async (event: SubmitEvent<HTMLFormElement>) => {
            event.preventDefault();

            const submitValue = metricBuilderOutput ?? value;

            if (!dashboard || !submitValue.datasetId) {
                return false;
            }

            const nextName = submitValue.name.trim();
            const nextExpression = submitValue.expression.trim();
            if (!nextName || !nextExpression) {
                setError('Metric name and expression are required.');

                return false;
            }

            const trimmedTarget = submitValue.target.trim();
            const parsedTarget = trimmedTarget === '' ? null : Number(trimmedTarget);
            if (parsedTarget !== null && !Number.isFinite(parsedTarget)) {
                setError('Target must be a number.');

                return false;
            }

            const trimmedValueMultiplier = submitValue.valueMultiplier.trim();
            const parsedValueMultiplier =
                trimmedValueMultiplier === '' ? 1 : Number(trimmedValueMultiplier);
            if (!Number.isFinite(parsedValueMultiplier)) {
                setError('Multiplier must be a number.');

                return false;
            }

            const configPayload = {
                target: parsedTarget,
                targetDirection:
                    parsedTarget === null ? null : submitValue.targetDirection,
                showTrend: submitValue.showTrend,
                timeColumn: submitValue.timeColumn || null,
                timeBucket: submitValue.timeBucket || null,
            };

            const version = generation.current;
            try {
                setError('');
                const payload = {
                    orgId: dashboard.orgId,
                    dashboardId: dashboard.id,
                    datasetId: submitValue.datasetId,
                    name: nextName,
                    expression: nextExpression,
                    format: submitValue.format.trim(),
                    valueMultiplier: parsedValueMultiplier,
                    ...configPayload,
                };
                const outcome = editingMetricId
                    ? await updateState.executeOutcome({
                          ...payload,
                          itemId: editingMetricId,
                      })
                    : await addState.executeOutcome({ ...payload, height: 4 });
                if (version !== generation.current) {
                    return false;
                }
                if (outcome.syncError) {
                    onSynchronizedError(
                        'Метрика сохранена, но обновление данных не удалось. Обновите данные.'
                    );
                }
                close();

                return true;
            } catch (saveError) {
                if (version !== generation.current) {
                    return false;
                }
                const fallback = editingMetricId
                    ? 'Unable to update this metric.'
                    : 'Unable to add this metric.';

                setError(getApiErrorMessage(saveError, fallback));

                return false;
            }
        },
        [
            addState.executeOutcome,
            close,
            dashboard,
            editingMetricId,
            metricBuilderOutput,
            onSynchronizedError,
            updateState.executeOutcome,
            value,
        ]
    );

    return {
        disabled: addState.isPending || updateState.isPending,
        editing: editingMetricId !== null,
        error,
        value,
        close,
        openAdd,
        openEdit,
        setOutput: setMetricBuilderOutput,
        setValue,
        submit,
    };
};
