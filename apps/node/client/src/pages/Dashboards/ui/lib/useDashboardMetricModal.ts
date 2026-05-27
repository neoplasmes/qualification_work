import { useCallback, useEffect, useState, type FormEvent } from 'react';
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
    setWorkspaceMetricExpression,
    setWorkspaceMetricForm,
    setWorkspaceMetricFormat,
    setWorkspaceMetricName,
} from '../../model';

type Refetch = () => Promise<unknown> | unknown;

type UseDashboardMetricModalParams = {
    dashboard: Dashboard | null | undefined;
    datasets: DatasetMetadata[] | undefined;
    refetchDashboard: Refetch;
    refetchDashboards: Refetch;
};

const getFirstDatasetId = (datasets: DatasetMetadata[] | undefined) =>
    datasets?.[0]?.dataset.id ?? '';

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

    const [addDashboardMetric, addState] = useAddDashboardMetricMutation();
    const [updateDashboardMetric, updateState] = useUpdateDashboardMetricMutation();

    useEffect(() => {
        setSelectedDatasetId(current => {
            const hasCurrent = datasets?.some(item => item.dataset.id === current);

            return hasCurrent ? current : getFirstDatasetId(datasets);
        });
    }, [datasets]);

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
            dispatch(
                setWorkspaceMetricForm({
                    name: item.name,
                    expression: item.expression,
                    format: item.format,
                })
            );
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

            try {
                setError('');
                if (editingMetricId) {
                    await updateDashboardMetric({
                        dashboardId: dashboard.id,
                        itemId: editingMetricId,
                        datasetId: selectedDatasetId,
                        name: nextName,
                        expression: nextExpression,
                        format,
                    }).unwrap();
                } else {
                    await addDashboardMetric({
                        dashboardId: dashboard.id,
                        datasetId: selectedDatasetId,
                        name: nextName,
                        expression: nextExpression,
                        format,
                        height: 4,
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
            updateDashboardMetric,
        ]
    );

    return {
        datasetId: selectedDatasetId,
        disabled: addState.isLoading || updateState.isLoading,
        editing: editingMetricId !== null,
        error,
        expression,
        format,
        name,
        close,
        openAdd,
        openEdit,
        setDatasetId: setSelectedDatasetId,
        setExpression,
        setFormat,
        setName,
        submit,
    };
};
