import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import {
    useDeleteChartMutation,
    useLazyGetChartDataQuery,
    useListChartsQuery,
    type ChartResponse,
    type FilterClause,
} from '@/entities/chart';
import { useListDatasetsQuery, type DatasetMetadata } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { getSelected } from '@/shared/lib/getSelected';

import { chartsTestIds } from '../const';
import {
    selectBuilderDatasetId,
    selectChart,
    selectSelectedChartId,
    selectShowDatasetPicker,
    setBuilderDatasetId,
    setShowDatasetPicker,
} from '../model';
import {
    CreateChartBuilderSection,
    EditChartBuilderSection,
} from './components/ChartBuilderSection';
import { CreateChartModal } from './components/CreateChartModal';
import { SavedChartDetails } from './components/SavedChartDetails';

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
                ? (datasetsQuery.data?.find(
                      d => d.dataset.id === selectedChart.datasetId
                  ) ?? null)
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
        if (!selectedChart) {
            return;
        }

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
        selectedChart && chartResult?.chartId === selectedChart.id
            ? chartResult.data
            : null;

    return (
        <>
            <section
                className={styles['panel']}
                data-test-id={chartsTestIds.workspace}
                aria-label="Chart details"
            >
                {!selectedChart && !builderDataset && (
                    <p className={styles['panel-placeholder']}>
                        Select a chart or create a new one.
                    </p>
                )}

                {builderDataset && org && (
                    <CreateChartBuilderSection
                        orgId={org.id}
                        dataset={builderDataset}
                        onChangeDataset={() => dispatch(setShowDatasetPicker(true))}
                        onChartCreated={chartId => void handleChartCreated(chartId)}
                    />
                )}

                {selectedChart && !builderDataset && !isEditing && (
                    <SavedChartDetails
                        chart={selectedChart}
                        chartResult={selectedChartResult}
                        error={error}
                        isLoadingData={chartDataQuery.isFetching}
                        isDeleting={deleteChartState.isLoading}
                        canEdit={Boolean(editDataset)}
                        deleteConfirmationId={deleteConfirmationId}
                        onEdit={() => setIsEditing(true)}
                        onRefreshData={() => void handleRefreshData()}
                        onDelete={() => void handleDeleteChart()}
                    />
                )}

                {selectedChart && !builderDataset && isEditing && editDataset && org && (
                    <EditChartBuilderSection
                        orgId={org.id}
                        chart={selectedChart}
                        dataset={editDataset}
                        onCancel={() => setIsEditing(false)}
                        onChartUpdated={() => void handleChartUpdated()}
                    />
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
