import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    WorkspaceModeTabs,
    type WorkspaceModeTabOption,
} from '@/widgets/WorkspaceModeTabs';
import { WorkspaceTitleEditor } from '@/widgets/WorkspaceTitleEditor';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import { usePatchChartMutation } from '@/features/buildChart';

import {
    useLazyGetChartDataQuery,
    useListChartsQuery,
    type ChartResponse,
    type FilterClause,
} from '@/entities/chart';
import { useListDatasetsQuery, type DatasetMetadata } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { getSelected } from '@/shared/lib/getSelected';
import { PanelPlaceholder } from '@/shared/ui';

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

type WorkspaceMode = 'view' | 'edit';

const CHARTS_WORKSPACE_MODE_TABS = [
    {
        value: 'view',
        label: 'View',
        testId: chartsTestIds.workspaceViewTab,
    },
    {
        value: 'edit',
        label: 'Edit',
        testId: chartsTestIds.workspaceEditTab,
    },
] as const satisfies readonly WorkspaceModeTabOption<WorkspaceMode>[];

export const ChartsWorkspace = () => {
    const dispatch = useDispatch();
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [chartResult, setChartResult] = useState<{
        chartId: string;
        data: ChartResponse;
    } | null>(null);
    const chartDataRequestRef = useRef(0);

    const selectedChartId = useSelector(selectSelectedChartId);
    const builderDatasetId = useSelector(selectBuilderDatasetId);
    const showDatasetPicker = useSelector(selectShowDatasetPicker);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const [getChartData, chartDataQuery] = useLazyGetChartDataQuery();
    const [patchChart, patchChartState] = usePatchChartMutation();

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

    const handleRenameChart = async (name: string) => {
        if (!selectedChart) {
            return;
        }

        try {
            setError('');
            await patchChart({ chartId: selectedChart.id, name }).unwrap();
            await chartsQuery.refetch();
        } catch (renameError) {
            const message = getApiErrorMessage(
                renameError,
                'Unable to rename this chart.'
            );
            setError(message);

            throw new Error(message);
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
                    <PanelPlaceholder>
                        Select a chart or create a new one.
                    </PanelPlaceholder>
                )}

                {builderDataset && org && (
                    <CreateChartBuilderSection
                        orgId={org.id}
                        dataset={builderDataset}
                        onChangeDataset={() => dispatch(setShowDatasetPicker(true))}
                        onChartCreated={chartId => void handleChartCreated(chartId)}
                    />
                )}

                {selectedChart && !builderDataset && (
                    <>
                        <div data-stack="v" data-gap="sm">
                            <WorkspaceTitleEditor
                                eyebrow="Chart"
                                title={selectedChart.name}
                                fallbackTitle="Untitled chart"
                                meta={selectedChart.chartType}
                                saving={patchChartState.isLoading}
                                editButtonTestId={chartsTestIds.renameButton}
                                inputTestId={chartsTestIds.renameInput}
                                onRename={handleRenameChart}
                            />

                            <WorkspaceModeTabs
                                value={isEditing ? 'edit' : 'view'}
                                options={CHARTS_WORKSPACE_MODE_TABS}
                                layoutId="charts-workspace-mode"
                                onChange={mode => setIsEditing(mode === 'edit')}
                            />
                        </div>

                        {!isEditing && (
                            <SavedChartDetails
                                chartResult={selectedChartResult}
                                error={error}
                                isLoadingData={chartDataQuery.isFetching}
                            />
                        )}

                        {isEditing && editDataset && org && (
                            <EditChartBuilderSection
                                orgId={org.id}
                                chart={selectedChart}
                                dataset={editDataset}
                                onChartUpdated={() => void handleChartUpdated()}
                            />
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
