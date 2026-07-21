import { useCallback, useEffect, useMemo, useState, type SubmitEvent } from 'react';
import { useStore } from 'zustand';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import type { MetricBuilderDraft, MetricBuilderOutput } from '@/widgets/MetricBuilder';

import {
    useAddDashboardMetricMutation,
    useUpdateDashboardMetricMutation,
} from '@/features/manageDashboards';

import type { Dashboard, DashboardMetricItem } from '@/entities/dashboard';

import { getApiErrorMessage } from '@/shared/api';

import { createMetricFormStore, type WorkspaceMetricForm } from './metricForm.store';

type Refetch = () => Promise<unknown> | unknown;

type UseDashboardMetricModalParams = {
    dashboard: Dashboard | null | undefined;
    datasets: DatasetMetadata[] | undefined;
    refetchDashboard: Refetch;
    refetchDashboards: Refetch;
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
    refetchDashboard,
    refetchDashboards,
}: UseDashboardMetricModalParams) => {
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

    const [addDashboardMetric, addState] = useAddDashboardMetricMutation();
    const [updateDashboardMetric, updateState] = useUpdateDashboardMetricMutation();

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
        setEditingMetricId(null);
        setMetricBuilderOutput(null);
        setError('');
        setSelectedDatasetId(getFirstDatasetId(datasets));
        clearWorkspaceMetricForm();
    }, [datasets, clearWorkspaceMetricForm]);

    const openEdit = useCallback(
        (item: DashboardMetricItem) => {
            setEditingMetricId(item.id);
            setMetricBuilderOutput({ datasetId: item.datasetId, ...itemToForm(item) });
            setError('');
            setSelectedDatasetId(item.datasetId);
            setWorkspaceMetricForm(itemToForm(item));
        },
        [setWorkspaceMetricForm, clearWorkspaceMetricForm]
    );

    const close = useCallback(() => {
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

            try {
                setError('');
                if (editingMetricId) {
                    await updateDashboardMetric({
                        dashboardId: dashboard.id,
                        itemId: editingMetricId,
                        datasetId: submitValue.datasetId,
                        name: nextName,
                        expression: nextExpression,
                        format: submitValue.format.trim(),
                        valueMultiplier: parsedValueMultiplier,
                        ...configPayload,
                    }).unwrap();
                } else {
                    await addDashboardMetric({
                        dashboardId: dashboard.id,
                        datasetId: submitValue.datasetId,
                        name: nextName,
                        expression: nextExpression,
                        format: submitValue.format.trim(),
                        valueMultiplier: parsedValueMultiplier,
                        ...configPayload,
                    }).unwrap();
                }

                close();
                await refetchDashboard();
                await refetchDashboards();

                return true;
            } catch (saveError) {
                const fallback = editingMetricId
                    ? 'Unable to update this metric.'
                    : 'Unable to add this metric.';

                setError(getApiErrorMessage(saveError, fallback));

                return false;
            }
        },
        [
            addDashboardMetric,
            close,
            dashboard,
            editingMetricId,
            metricBuilderOutput,
            refetchDashboard,
            refetchDashboards,
            updateDashboardMetric,
            value,
        ]
    );

    return {
        disabled: addState.isLoading || updateState.isLoading,
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
