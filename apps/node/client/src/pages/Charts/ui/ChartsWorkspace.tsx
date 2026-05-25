import { skipToken } from '@reduxjs/toolkit/query';
import { Pencil, RefreshCcw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import {
    useDeleteChartMutation,
    useLazyGetChartDataQuery,
    useListChartsQuery,
    type ChartResponse,
    type FilterClause,
} from '@/features/charts';
import { useListDatasetsQuery, type DatasetMetadata } from '@/features/datasets';

import { ChartResult } from '@/entities/chart';

import { DatasetChartBuilder, configToBuilderFields } from '@/widgets/DatasetChartBuilder';

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
    setBuilderDatasetId,
    setShowDatasetPicker,
} from '../model/chartsPageSlice';

import styles from './ChartsPage.module.scss';

export const ChartsWorkspace = () => {
    const dispatch = useDispatch();
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [chartResult, setChartResult] = useState<{
        chartId: string;
        data: ChartResponse;
    } | null>(null);
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const chartDataRequestRef = useRef(0);

    const selectedChartId = useSelector(selectSelectedChartId);
    const builderDatasetId = useSelector(selectBuilderDatasetId);
    const showDatasetPicker = useSelector(selectShowDatasetPicker);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const [getChartData, chartDataQuery] = useLazyGetChartDataQuery();
    const [deleteChart, deleteChartState] = useDeleteChartMutation();

    const selectedChart = useMemo(
        () => getSelected(chartsQuery.data, selectedChartId),
        [chartsQuery.data, selectedChartId]
    );

    const builderDataset = useMemo(
        () => datasetsQuery.data?.find(d => d.dataset.id === builderDatasetId) ?? null,
        [datasetsQuery.data, builderDatasetId]
    );

    const editDataset = useMemo(
        () =>
            selectedChart
                ? (datasetsQuery.data?.find(d => d.dataset.id === selectedChart.datasetId) ?? null)
                : null,
        [datasetsQuery.data, selectedChart]
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
            setChartResult(null);
            setIsEditing(false);
            return;
        }

        setError('');
        setDeleteConfirmationId(null);
        setChartResult(null);
        setIsEditing(false);
        void loadChartData(selectedChart.id).catch(loadError => {
            setError(getApiErrorMessage(loadError, 'Unable to load chart data.'));
        });
    }, [selectedChart?.id]);

    const handleDatasetSelect = (dataset: DatasetMetadata) => {
        dispatch(setBuilderDatasetId(dataset.dataset.id));
    };

    const handleChartCreated = async (chartId: string) => {
        await chartsQuery.refetch();
        dispatch(setBuilderDatasetId(null));
        dispatch(selectChart(chartId));
    };

    const handleChartUpdated = async () => {
        if (!selectedChart) {return;}
        await chartsQuery.refetch();
        setIsEditing(false);
        void loadChartData(selectedChart.id).catch(loadError => {
            setError(getApiErrorMessage(loadError, 'Unable to load chart data.'));
        });
    };

    const handleRefreshData = async () => {
        if (!selectedChart) {
            return;
        }

        try {
            setError('');
            await loadChartData(selectedChart.id);
        } catch (refreshError) {
            setError(getApiErrorMessage(refreshError, 'Unable to refresh chart data.'));
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

                {selectedChart && !builderDataset && !isEditing && (
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
                            <div data-stack="h" data-gap="sm">
                                <Button
                                    disabled={!editDataset}
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Pencil size={18} />
                                    Edit
                                </Button>
                                <Button
                                    disabled={chartDataQuery.isFetching}
                                    onClick={() => void handleRefreshData()}
                                >
                                    <RefreshCcw size={18} />
                                    Refresh data
                                </Button>
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
                        </div>

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

                {selectedChart && !builderDataset && isEditing && editDataset && org && (
                    <>
                        <div className={styles['builder-header']}>
                            <div data-stack="v" data-gap="xs">
                                <span className={styles['eyebrow']}>Edit chart</span>
                                <h2 className={styles['title']}>{selectedChart.name}</h2>
                            </div>
                            <Button onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                        </div>
                        <DatasetChartBuilder
                            key={`edit-${selectedChart.id}`}
                            orgId={org.id}
                            selectedDataset={editDataset}
                            editChartId={selectedChart.id}
                            initialFields={configToBuilderFields(
                                selectedChart.config,
                                selectedChart.chartType
                            )}
                            onChartUpdated={() => void handleChartUpdated()}
                        />
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
