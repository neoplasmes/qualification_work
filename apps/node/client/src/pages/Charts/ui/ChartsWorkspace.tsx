import { skipToken } from '@reduxjs/toolkit/query';
import { RefreshCcw, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import {
    useDeleteChartMutation,
    useLazyGetChartDataQuery,
    useListChartsQuery,
    useUpdateChartMutation,
    type ChartResponse,
    type ChartType,
    type FilterClause,
} from '@/features/charts';
import { useListDatasetsQuery, type DatasetMetadata } from '@/features/datasets';

import { ChartResult } from '@/entities/chart';

import { DatasetChartBuilder } from '@/widgets/DatasetChartBuilder';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { getSelected } from '@/shared/lib/getSelected';
import { Button } from '@/shared/ui';

import { CreateChartModal } from './CreateChartModal';

import {
    selectChart,
    selectSelectedChartId,
    selectBuilderDatasetId,
    selectShowDatasetPicker,
    selectWorkspaceDraftChartId,
    selectWorkspaceDraftName,
    selectWorkspaceDraftChartType,
    selectWorkspaceDraftConfigText,
    selectWorkspaceFilterOverrideText,
    setBuilderDatasetId,
    setShowDatasetPicker,
    initWorkspaceDraft,
    resetWorkspaceDraft,
    setWorkspaceDraftName,
    setWorkspaceDraftChartType,
    setWorkspaceDraftConfigText,
    setWorkspaceFilterOverrideText,
} from '../model/chartsPageSlice';

import styles from './ChartsPage.module.scss';

export const ChartsWorkspace = () => {
    const dispatch = useDispatch();
    const [error, setError] = useState('');
    const [chartResult, setChartResult] = useState<{
        chartId: string;
        data: ChartResponse;
    } | null>(null);
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const chartDataRequestRef = useRef(0);

    const selectedChartId = useSelector(selectSelectedChartId);
    const builderDatasetId = useSelector(selectBuilderDatasetId);
    const showDatasetPicker = useSelector(selectShowDatasetPicker);
    const workspaceDraftChartId = useSelector(selectWorkspaceDraftChartId);
    const draftName = useSelector(selectWorkspaceDraftName);
    const draftChartType = useSelector(selectWorkspaceDraftChartType);
    const draftConfigText = useSelector(selectWorkspaceDraftConfigText);
    const filterOverrideText = useSelector(selectWorkspaceFilterOverrideText);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const [getChartData, chartDataQuery] = useLazyGetChartDataQuery();
    const [updateChart, updateChartState] = useUpdateChartMutation();
    const [deleteChart, deleteChartState] = useDeleteChartMutation();

    const selectedChart = useMemo(
        () => getSelected(chartsQuery.data, selectedChartId),
        [chartsQuery.data, selectedChartId]
    );

    const builderDataset = useMemo(
        () => datasetsQuery.data?.find(d => d.dataset.id === builderDatasetId) ?? null,
        [datasetsQuery.data, builderDatasetId]
    );

    const loadChartData = async (chartId: string, filterOverrides?: FilterClause[]) => {
        const requestId = chartDataRequestRef.current + 1;
        chartDataRequestRef.current = requestId;

        let data: ChartResponse;

        try {
            data = await getChartData(
                filterOverrides ? { chartId, filterOverrides } : chartId,
                false
            ).unwrap();
        } catch (loadError) {
            if (chartDataRequestRef.current !== requestId) {
                return undefined;
            }

            throw loadError;
        }

        if (chartDataRequestRef.current === requestId) {
            setChartResult({ chartId, data });
        }

        return data;
    };

    useEffect(() => {
        if (!selectedChart) {
            dispatch(resetWorkspaceDraft());
            setChartResult(null);

            return;
        }

        // preserve draft when navigating back to the same chart
        if (selectedChart.id === workspaceDraftChartId) {
            return;
        }

        dispatch(
            initWorkspaceDraft({
                chartId: selectedChart.id,
                name: selectedChart.name,
                chartType: selectedChart.chartType,
                configText: JSON.stringify(selectedChart.config, null, 2),
            })
        );
        setError('');
        setDeleteConfirmationId(null);
        setChartResult(null);
        void loadChartData(selectedChart.id).catch(loadError => {
            setError(getApiErrorMessage(loadError, 'Unable to load chart data.'));
        });
    }, [selectedChart]);

    const handleDatasetSelect = (dataset: DatasetMetadata) => {
        dispatch(setBuilderDatasetId(dataset.dataset.id));
    };

    const handleChartCreated = async (chartId: string) => {
        await chartsQuery.refetch();
        dispatch(setBuilderDatasetId(null));
        dispatch(selectChart(chartId));
    };

    const getFilterOverrides = (): FilterClause[] | undefined => {
        const raw = filterOverrideText.trim();
        if (!raw) {
            return undefined;
        }

        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
            throw new Error('Filter overrides must be a JSON array.');
        }

        return parsed as FilterClause[];
    };

    const handleRefreshData = async () => {
        if (!selectedChart) {
            return;
        }

        try {
            setError('');
            await loadChartData(selectedChart.id, getFilterOverrides());
        } catch (refreshError) {
            setError(
                refreshError instanceof Error
                    ? refreshError.message
                    : getApiErrorMessage(refreshError, 'Unable to refresh chart data.')
            );
        }
    };

    const handleSaveChart = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedChart) {
            return;
        }

        const name = draftName.trim();
        if (!name) {
            setError('Chart name can not be empty.');

            return;
        }

        try {
            const config = JSON.parse(draftConfigText) as Record<string, unknown>;
            await updateChart({
                chartId: selectedChart.id,
                name,
                chartType: draftChartType,
                config,
            }).unwrap();
            await chartsQuery.refetch();
            await handleRefreshData();
        } catch (saveError) {
            setError(
                saveError instanceof SyntaxError
                    ? 'Chart config must be valid JSON.'
                    : getApiErrorMessage(saveError, 'Unable to save this chart.')
            );
        }
    };

    const handleDeleteChart = async () => {
        if (!selectedChart) {
            return;
        }

        if (deleteConfirmationId !== selectedChart.id) {
            setDeleteConfirmationId(selectedChart.id);

            return;
        }

        try {
            await deleteChart(selectedChart.id).unwrap();
            dispatch(selectChart(null));
            setChartResult(null);
            setDeleteConfirmationId(null);
            await chartsQuery.refetch();
        } catch (deleteError) {
            setError(getApiErrorMessage(deleteError, 'Unable to delete this chart.'));
        }
    };

    const selectedChartResult =
        selectedChart && chartResult?.chartId === selectedChart.id ? chartResult.data : null;

    return (
        <>
            <section className={styles['panel']} aria-label="Chart details">
                {!selectedChart && !builderDataset && (
                    <p className={styles['panel-placeholder']}>
                        Select a chart or create a new one.
                    </p>
                )}

                {builderDataset && org && (
                    <>
                        <div className={styles['builder-header']}>
                            <div data-stack="v" data-gap="xs">
                                <span className={styles['eyebrow']}>New chart</span>
                                <h2 className={styles['title']}>{builderDataset.dataset.name}</h2>
                            </div>
                            <Button onClick={() => dispatch(setShowDatasetPicker(true))}>
                                Change dataset
                            </Button>
                        </div>
                        <DatasetChartBuilder
                            key={builderDataset.dataset.id}
                            orgId={org.id}
                            selectedDataset={builderDataset}
                            onChartCreated={chartId => void handleChartCreated(chartId)}
                        />
                    </>
                )}

                {selectedChart && !builderDataset && (
                    <>
                        <div className={styles['detail-header']}>
                            <div data-stack="v" data-gap="xs">
                                <span className={styles['eyebrow']}>Chart</span>
                                <h2 className={styles['title']}>{selectedChart.name}</h2>
                                <p className={styles['muted']}>
                                    {selectedChart.chartType} &middot; dataset{' '}
                                    {selectedChart.datasetId.slice(0, 8)}
                                </p>
                            </div>
                            <Button
                                variant="danger"
                                disabled={deleteChartState.isLoading}
                                onClick={() => void handleDeleteChart()}
                            >
                                <Trash2 size={18} />
                                {deleteConfirmationId === selectedChart.id
                                    ? 'Confirm delete'
                                    : 'Delete'}
                            </Button>
                        </div>

                        <form className={styles['edit-form']} onSubmit={handleSaveChart}>
                            <label className={styles['control']}>
                                <span>Name</span>
                                <input
                                    value={draftName}
                                    onChange={event =>
                                        dispatch(setWorkspaceDraftName(event.target.value))
                                    }
                                />
                            </label>
                            <label className={styles['control']}>
                                <span>Type</span>
                                <select
                                    value={draftChartType}
                                    onChange={event =>
                                        dispatch(
                                            setWorkspaceDraftChartType(
                                                event.target.value as ChartType
                                            )
                                        )
                                    }
                                >
                                    <option value="bar">bar</option>
                                    <option value="line">line</option>
                                    <option value="pie">pie</option>
                                    <option value="heatmap">heatmap</option>
                                </select>
                            </label>
                            <label className={styles['control']}>
                                <span>Config</span>
                                <textarea
                                    value={draftConfigText}
                                    rows={8}
                                    spellCheck={false}
                                    onChange={event =>
                                        dispatch(setWorkspaceDraftConfigText(event.target.value))
                                    }
                                />
                            </label>
                            <label className={styles['control']}>
                                <span>Runtime filters</span>
                                <textarea
                                    value={filterOverrideText}
                                    rows={8}
                                    spellCheck={false}
                                    placeholder='[{"columnId":"...","op":"eq","value":"..."}]'
                                    onChange={event =>
                                        dispatch(
                                            setWorkspaceFilterOverrideText(event.target.value)
                                        )
                                    }
                                />
                            </label>
                            <Button type="submit" disabled={updateChartState.isLoading}>
                                <Save size={18} />
                                Save chart
                            </Button>
                            <Button
                                disabled={chartDataQuery.isFetching}
                                onClick={() => void handleRefreshData()}
                            >
                                <RefreshCcw size={18} />
                                Refresh data
                            </Button>
                        </form>

                        {error && (
                            <div
                                role="alert"
                                className={`${styles['status']} ${styles['error']}`}
                            >
                                {error}
                            </div>
                        )}

                        {chartDataQuery.isFetching && (
                            <div className={styles['status']}>Loading chart data...</div>
                        )}

                        {selectedChartResult && (
                            <ChartResult
                                data={selectedChartResult}
                                kind={selectedChartResult.kind}
                                ariaLabel="Saved chart result"
                            >
                                <span>
                                    Aggregated at{' '}
                                    {formatDate(selectedChartResult.aggregatedAt)}
                                </span>
                            </ChartResult>
                        )}
                    </>
                )}
            </section>

            {showDatasetPicker && (
                <CreateChartModal
                    datasets={datasetsQuery.data}
                    onSelect={handleDatasetSelect}
                    onClose={() => dispatch(setShowDatasetPicker(false))}
                />
            )}
        </>
    );
};
