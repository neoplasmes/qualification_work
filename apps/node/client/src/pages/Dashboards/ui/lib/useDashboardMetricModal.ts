import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    useAddDashboardMetricMutation,
    useUpdateDashboardMetricMutation,
} from '@/features/manageDashboards';

import type { Dashboard, DashboardMetricItem } from '@/entities/dashboard';
import type { DatasetMetadata } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';

import {
    clearWorkspaceMetricForm,
    selectWorkspaceMetricExpression,
    selectWorkspaceMetricFormat,
    selectWorkspaceMetricName,
    selectWorkspaceMetricShowTrend,
    selectWorkspaceMetricTarget,
    selectWorkspaceMetricTargetDirection,
    selectWorkspaceMetricTimeBucket,
    selectWorkspaceMetricTimeColumn,
    selectWorkspaceMetricValueMultiplier,
    setWorkspaceMetricExpression,
    setWorkspaceMetricForm,
    setWorkspaceMetricFormat,
    setWorkspaceMetricName,
    setWorkspaceMetricShowTrend,
    setWorkspaceMetricTarget,
    setWorkspaceMetricTargetDirection,
    setWorkspaceMetricTimeBucket,
    setWorkspaceMetricTimeColumn,
    setWorkspaceMetricValueMultiplier,
    type WorkspaceMetricForm,
} from '../../model';

type Refetch = () => Promise<unknown> | unknown;

type UseDashboardMetricModalParams = {
    dashboard: Dashboard | null | undefined;
    datasets: DatasetMetadata[] | undefined;
    refetchDashboard: Refetch;
    refetchDashboards: Refetch;
};

/**
 * the goal and trend config slice of the metric form, edited as one object
 */
export type MetricConfigForm = Pick<
    WorkspaceMetricForm,
    'target' | 'targetDirection' | 'showTrend' | 'timeColumn' | 'timeBucket'
>;

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
    const dispatch = useDispatch();
    const [selectedDatasetId, setSelectedDatasetId] = useState('');
    const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const name = useSelector(selectWorkspaceMetricName);
    const expression = useSelector(selectWorkspaceMetricExpression);
    const format = useSelector(selectWorkspaceMetricFormat);
    const valueMultiplier = useSelector(selectWorkspaceMetricValueMultiplier);
    const target = useSelector(selectWorkspaceMetricTarget);
    const targetDirection = useSelector(selectWorkspaceMetricTargetDirection);
    const showTrend = useSelector(selectWorkspaceMetricShowTrend);
    const timeColumn = useSelector(selectWorkspaceMetricTimeColumn);
    const timeBucket = useSelector(selectWorkspaceMetricTimeBucket);

    const [addDashboardMetric, addState] = useAddDashboardMetricMutation();
    const [updateDashboardMetric, updateState] = useUpdateDashboardMetricMutation();

    useEffect(() => {
        setSelectedDatasetId(current => {
            const hasCurrent = datasets?.some(item => item.dataset.id === current);

            return hasCurrent ? current : getFirstDatasetId(datasets);
        });
    }, [datasets]);

    const config = useMemo<MetricConfigForm>(
        () => ({ target, targetDirection, showTrend, timeColumn, timeBucket }),
        [target, targetDirection, showTrend, timeColumn, timeBucket]
    );

    const setConfig = useCallback(
        (patch: Partial<MetricConfigForm>) => {
            if (patch.target !== undefined) {
                dispatch(setWorkspaceMetricTarget(patch.target));
            }
            if (patch.targetDirection !== undefined) {
                dispatch(setWorkspaceMetricTargetDirection(patch.targetDirection));
            }
            if (patch.showTrend !== undefined) {
                dispatch(setWorkspaceMetricShowTrend(patch.showTrend));
            }
            if (patch.timeColumn !== undefined) {
                dispatch(setWorkspaceMetricTimeColumn(patch.timeColumn));
            }
            if (patch.timeBucket !== undefined) {
                dispatch(setWorkspaceMetricTimeBucket(patch.timeBucket));
            }
        },
        [dispatch]
    );

    const openAdd = useCallback(() => {
        setEditingMetricId(null);
        setError('');
        setSelectedDatasetId(getFirstDatasetId(datasets));
        dispatch(clearWorkspaceMetricForm());
    }, [datasets, dispatch]);

    const openEdit = useCallback(
        (item: DashboardMetricItem) => {
            setEditingMetricId(item.id);
            setError('');
            setSelectedDatasetId(item.datasetId);
            dispatch(setWorkspaceMetricForm(itemToForm(item)));
        },
        [dispatch]
    );

    const close = useCallback(() => {
        setEditingMetricId(null);
        setError('');
        dispatch(clearWorkspaceMetricForm());
    }, [dispatch]);

    const setName = useCallback(
        (value: string) => {
            dispatch(setWorkspaceMetricName(value));
        },
        [dispatch]
    );

    const setExpression = useCallback(
        (value: string) => {
            dispatch(setWorkspaceMetricExpression(value));
        },
        [dispatch]
    );

    const setFormat = useCallback(
        (value: DashboardMetricItem['format']) => {
            dispatch(setWorkspaceMetricFormat(value));
        },
        [dispatch]
    );

    const setValueMultiplier = useCallback(
        (value: string) => {
            dispatch(setWorkspaceMetricValueMultiplier(value));
        },
        [dispatch]
    );

    const submit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!dashboard || !selectedDatasetId) {
                return false;
            }

            const nextName = name.trim();
            const nextExpression = expression.trim();
            if (!nextName || !nextExpression) {
                setError('Metric name and expression are required.');

                return false;
            }

            const trimmedTarget = target.trim();
            const parsedTarget = trimmedTarget === '' ? null : Number(trimmedTarget);
            if (parsedTarget !== null && !Number.isFinite(parsedTarget)) {
                setError('Target must be a number.');

                return false;
            }

            const trimmedValueMultiplier = valueMultiplier.trim();
            const parsedValueMultiplier =
                trimmedValueMultiplier === '' ? 1 : Number(trimmedValueMultiplier);
            if (!Number.isFinite(parsedValueMultiplier)) {
                setError('Multiplier must be a number.');

                return false;
            }

            const configPayload = {
                target: parsedTarget,
                targetDirection: parsedTarget === null ? null : targetDirection,
                showTrend,
                timeColumn: timeColumn || null,
                timeBucket: timeBucket || null,
            };

            try {
                setError('');
                if (editingMetricId) {
                    await updateDashboardMetric({
                        dashboardId: dashboard.id,
                        itemId: editingMetricId,
                        datasetId: selectedDatasetId,
                        name: nextName,
                        expression: nextExpression,
                        format: format.trim(),
                        valueMultiplier: parsedValueMultiplier,
                        ...configPayload,
                    }).unwrap();
                } else {
                    await addDashboardMetric({
                        dashboardId: dashboard.id,
                        datasetId: selectedDatasetId,
                        name: nextName,
                        expression: nextExpression,
                        format: format.trim(),
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
            expression,
            format,
            name,
            refetchDashboard,
            refetchDashboards,
            selectedDatasetId,
            showTrend,
            target,
            targetDirection,
            timeBucket,
            timeColumn,
            updateDashboardMetric,
            valueMultiplier,
        ]
    );

    return {
        datasetId: selectedDatasetId,
        disabled: addState.isLoading || updateState.isLoading,
        editing: editingMetricId !== null,
        error,
        expression,
        format,
        valueMultiplier,
        name,
        config,
        close,
        openAdd,
        openEdit,
        setDatasetId: setSelectedDatasetId,
        setExpression,
        setFormat,
        setValueMultiplier,
        setName,
        setConfig,
        submit,
    };
};
