import { skipToken } from '@reduxjs/toolkit/query';
import { RefreshCcw, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import {
    useDeleteChartMutation,
    useLazyGetChartDataQuery,
    useListChartsQuery,
    useUpdateChartMutation,
    type ChartType,
    type FilterClause,
} from '@/features/charts';
import { getApiErrorMessage } from '@/shared/api';
import { Button, ButtonLink } from '@/shared/ui';
import { getSelected } from '@/shared/lib/getSelected';
import { formatDate } from '@/shared/lib/formatDate';

import { ChartResult } from '@/entities/chart';

import { WorkspaceGrid } from '@/widgets/WorkspaceGrid';

import { ChartsListPanel } from './ChartsListPanel';
import styles from './ChartsPage.module.scss';

export const ChartsPage = () => {
    const [selectedChartId, setSelectedChartId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState('');
    const [draftChartType, setDraftChartType] = useState<ChartType>('bar');
    const [draftConfigText, setDraftConfigText] = useState('');
    const [filterOverrideText, setFilterOverrideText] = useState('');
    const [error, setError] = useState('');
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(
        null
    );

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const [getChartData, chartDataQuery] = useLazyGetChartDataQuery();
    const [updateChart, updateChartState] = useUpdateChartMutation();
    const [deleteChart, deleteChartState] = useDeleteChartMutation();

    const selectedChart = useMemo(
        () => getSelected(chartsQuery.data, selectedChartId),
        [chartsQuery.data, selectedChartId]
    );

    useEffect(() => {
        if (!selectedChart) {
            setDraftName('');

            return;
        }

        setDraftName(selectedChart.name);
        setDraftChartType(selectedChart.chartType);
        setDraftConfigText(JSON.stringify(selectedChart.config, null, 2));
        setError('');
        setDeleteConfirmationId(null);
        void getChartData(selectedChart.id, false);
    }, [getChartData, selectedChart]);

    const handleSelectChart = (chartId: string) => {
        setSelectedChartId(chartId);
        setError('');
        setDeleteConfirmationId(null);
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
            await getChartData(
                {
                    chartId: selectedChart.id,
                    filterOverrides: getFilterOverrides(),
                },
                false
            ).unwrap();
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
            setSelectedChartId(null);
            setDeleteConfirmationId(null);
            await chartsQuery.refetch();
        } catch (deleteError) {
            setError(getApiErrorMessage(deleteError, 'Unable to delete this chart.'));
        }
    };

    if (meQuery.isError) {
        return (
            <div className={styles['empty']}>
                <p>Sign in to view charts.</p>
                <ButtonLink to="/sign-in">Sign in</ButtonLink>
            </div>
        );
    }

    return (
        <WorkspaceGrid>
            <WorkspaceGrid.Group direction="row">
            <WorkspaceGrid.Panel initialSize="320px" minSize="280px" maxSize="440px">
                <ChartsListPanel
                    charts={chartsQuery.data}
                    loading={chartsQuery.isLoading}
                    fetching={chartsQuery.isFetching}
                    selectedChart={selectedChart}
                    onSelectChart={handleSelectChart}
                    onRefresh={() => void chartsQuery.refetch()}
                />
            </WorkspaceGrid.Panel>
            <WorkspaceGrid.Panel initialSize="800px" minSize="480px" maxSize="9999px">
            <section className={styles['panel']} aria-label="Chart details">
                {!selectedChart && (
                    <div className={styles['empty']}>Select a chart to inspect it.</div>
                )}

                {selectedChart && (
                    <>
                        <div className={styles['detail-header']}>
                            <div data-stack="v" data-gap="xs">
                                <span className={styles['eyebrow']}>Chart</span>
                                <h2 className={styles['title']}>{selectedChart.name}</h2>
                                <p className={styles['muted']}>
                                    {selectedChart.chartType} chart from dataset{' '}
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
                                    onChange={event => setDraftName(event.target.value)}
                                />
                            </label>
                            <label className={styles['control']}>
                                <span>Type</span>
                                <select
                                    value={draftChartType}
                                    onChange={event =>
                                        setDraftChartType(event.target.value as ChartType)
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
                                        setDraftConfigText(event.target.value)
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
                                        setFilterOverrideText(event.target.value)
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

                        {chartDataQuery.data && (
                            <ChartResult
                                data={chartDataQuery.data}
                                kind={chartDataQuery.data.kind}
                                ariaLabel="Saved chart result"
                            >
                                <span>
                                    Aggregated at{' '}
                                    {formatDate(chartDataQuery.data.aggregatedAt)}
                                </span>
                            </ChartResult>
                        )}
                    </>
                )}
            </section>
            </WorkspaceGrid.Panel>
            </WorkspaceGrid.Group>
        </WorkspaceGrid>
    );
};
