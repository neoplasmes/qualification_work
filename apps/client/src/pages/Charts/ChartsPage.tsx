import { skipToken } from '@reduxjs/toolkit/query';
import { Eye, PencilLine } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

import {
    ChartBuilder,
    configToBuilderDraft,
    createChartBuilderDraft,
    type ChartBuilderDraft,
    type ChartBuilderOutput,
} from '@/widgets/ChartBuilder';
import {
    WorkspaceModeTabs,
    type WorkspaceModeTabOption,
} from '@/widgets/WorkspaceModeTabs';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useGetChartQuery, useListChartsQuery } from '@/entities/chart';
import { useListDatasetsQuery, type DatasetMetadata } from '@/entities/dataset';

import { useAppSelector } from '@/shared/model';
import { Separator, StatusMessage } from '@/shared/ui';

import { chartsTestIds } from './const';
import {
    chartsWorkspaceIndexPath,
    chartsWorkspaceNewPath,
    getChartWorkspaceUrl,
    useChartDataResult,
    useChartsWorkspaceRouteSync,
} from './lib';
import {
    clearChartCreateDraft,
    clearChartEditDraft,
    selectChart,
    setChartCreateDraft,
    setChartCreateDraftValue,
    setChartCreateOutput,
    setChartEditDraft,
    setChartEditDraftValue,
    setChartEditOutput,
    setChartsWorkspaceMode,
    setShowDatasetPicker,
    type ChartsWorkspaceMode,
} from './model';
import { CreateChartBuilderSection } from './ui/ChartBuilderSection';
import { SavedChartDetails } from './ui/SavedChartDetails';
import { SelectDatasetForChartModal } from './ui/SelectDatasetForChartModal';

import styles from './ChartsPage.module.scss';

const chartsWorkspaceModeTabs = [
    {
        value: 'view',
        label: 'View',
        icon: Eye,
        testId: chartsTestIds.workspaceViewTab,
    },
    {
        value: 'edit',
        label: 'Edit',
        icon: PencilLine,
        testId: chartsTestIds.workspaceEditTab,
    },
] as const satisfies readonly WorkspaceModeTabOption<ChartsWorkspaceMode>[];

export const ChartsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [actionsEl, setActionsEl] = useState<HTMLDivElement | null>(null);

    const selectedChartId = useAppSelector(state => state.chartsPage.selectedChartId);
    const createDatasetId = useAppSelector(
        state => state.chartsPage.createDraft?.datasetId ?? null
    );
    const createDraft = useAppSelector(state => state.chartsPage.createDraft);
    const showDatasetPicker = useAppSelector(state => state.chartsPage.showDatasetPicker);
    const workspaceMode = useAppSelector(state => state.chartsPage.workspaceMode);
    const editDraft = useAppSelector(state => state.chartsPage.editDraft);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const selectedChartQuery = useGetChartQuery(selectedChartId ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);

    useChartsWorkspaceRouteSync({
        selectedChartId,
        createDatasetId,
        showDatasetPicker,
        workspaceMode,
    });

    const selectedChart = selectedChartQuery.data ?? null;
    const chartTitle = selectedChart?.name.trim() || 'Untitled chart';
    const chartData = useChartDataResult(selectedChart?.id ?? null, workspaceMode);

    const builderDataset = useMemo(
        () => datasetsQuery.data?.find(d => d.dataset.id === createDatasetId) ?? null,
        [datasetsQuery.data, createDatasetId]
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

    const savedEditDraft = useMemo(
        () =>
            selectedChart
                ? createChartBuilderDraft({
                      ...configToBuilderDraft(
                          selectedChart.config,
                          selectedChart.chartType
                      ),
                      chartName: selectedChart.name,
                  })
                : null,
        [selectedChart]
    );
    const editBuilderDraft =
        selectedChart && editDraft?.chartId === selectedChart.id
            ? editDraft.draft
            : savedEditDraft;

    const handleDatasetSelect = (dataset: DatasetMetadata) => {
        dispatch(
            setChartCreateDraft({
                datasetId: dataset.dataset.id,
                draft: createChartBuilderDraft(),
                output: null,
            })
        );
        navigate(chartsWorkspaceNewPath);
    };

    const handleChartCreated = async (chartId: string) => {
        await chartsQuery.refetch();

        dispatch(clearChartCreateDraft());
        dispatch(selectChart(chartId));

        navigate(getChartWorkspaceUrl(chartId, 'view'));
    };

    const handleWorkspaceModeChange = (mode: ChartsWorkspaceMode) => {
        if (!selectedChartId) {
            return;
        }

        dispatch(setChartsWorkspaceMode(mode));
        navigate(getChartWorkspaceUrl(selectedChartId, mode));
    };

    const handleCreateDraftChange = (draft: ChartBuilderDraft) => {
        dispatch(setChartCreateDraftValue(draft));
    };

    const handleCreateOutputChange = (output: ChartBuilderOutput) => {
        dispatch(setChartCreateOutput(output));
    };

    const handleEditDraftChange = (draft: ChartBuilderDraft) => {
        if (!selectedChart) {
            return;
        }

        if (editDraft?.chartId === selectedChart.id) {
            dispatch(setChartEditDraftValue({ chartId: selectedChart.id, draft }));

            return;
        }

        dispatch(setChartEditDraft({ chartId: selectedChart.id, draft, output: null }));
    };

    const handleEditOutputChange = (output: ChartBuilderOutput) => {
        if (!selectedChart) {
            return;
        }

        dispatch(setChartEditOutput({ chartId: selectedChart.id, output }));
    };

    const handleChartUpdated = async (chartId: string) => {
        await selectedChartQuery.refetch();
        await chartsQuery.refetch();
        dispatch(clearChartEditDraft(chartId));
    };

    return (
        <section
            className={styles['panel']}
            data-stack="v"
            data-gap="sm"
            data-flex
            data-test-id={chartsTestIds.workspace}
            aria-label="Chart details"
        >
            {!selectedChartId && !createDraft && !builderDataset && (
                <p
                    className={styles['placeholder']}
                    data-stack="h"
                    data-align="center"
                    data-justify="center"
                    data-flex
                >
                    Select a chart or create a new one.
                </p>
            )}

            {createDraft && !builderDataset && (
                // TODO: create <SkeletonLoader /> component
                <StatusMessage>Loading dataset...</StatusMessage>
            )}

            {selectedChartId && selectedChartQuery.isLoading && (
                // TODO: create <SkeletonLoader /> component
                <StatusMessage>Loading chart...</StatusMessage>
            )}

            {selectedChartId && selectedChartQuery.isError && (
                <StatusMessage tone="error">Unable to load this chart.</StatusMessage>
            )}

            {createDraft && builderDataset && org && (
                <CreateChartBuilderSection
                    orgId={org.id}
                    dataset={builderDataset}
                    draft={createDraft.draft}
                    onChangeDataset={() => {
                        dispatch(setShowDatasetPicker(true));
                        navigate(chartsWorkspaceNewPath);
                    }}
                    onCancel={() => {
                        dispatch(clearChartCreateDraft());
                        navigate(chartsWorkspaceIndexPath);
                    }}
                    onDraftChange={handleCreateDraftChange}
                    onOutputChange={handleCreateOutputChange}
                    onChartCreated={chartId => void handleChartCreated(chartId)}
                />
            )}

            {selectedChart && !builderDataset && (
                <>
                    <div
                        className={styles['top-line-block']}
                        data-stack="h"
                        data-align="center"
                    >
                        <h2 className={styles['title']}>{chartTitle}</h2>
                    </div>

                    <Separator />

                    <div
                        className={styles['tabs-row']}
                        data-stack="h"
                        data-gap="sm"
                        data-align="center"
                    >
                        <WorkspaceModeTabs
                            value={workspaceMode}
                            options={chartsWorkspaceModeTabs}
                            layoutId="charts-workspace-mode"
                            onChange={handleWorkspaceModeChange}
                        />
                        <div
                            ref={setActionsEl}
                            className={styles['tabs-actions']}
                            data-stack="h"
                            data-gap="sm"
                            data-align="center"
                        />
                    </div>

                    {workspaceMode === 'view' && (
                        <div
                            className={styles['scroll-area']}
                            data-stack="v"
                            data-gap="sm"
                            data-flex
                        >
                            <SavedChartDetails
                                chart={selectedChart}
                                columns={editDataset?.columns ?? []}
                                chartResult={chartData.chartResult}
                                error={chartData.error}
                                isLoadingData={chartData.isFetching}
                            />
                        </div>
                    )}

                    {workspaceMode === 'edit' && !editDataset && (
                        <StatusMessage>Loading dataset...</StatusMessage>
                    )}

                    {workspaceMode === 'edit' &&
                        editDataset &&
                        org &&
                        editBuilderDraft && (
                            <ChartBuilder
                                key={`edit-${selectedChart.id}`}
                                orgId={org.id}
                                selectedDataset={editDataset}
                                editChartId={selectedChart.id}
                                value={editBuilderDraft}
                                actionsContainer={actionsEl}
                                onChange={handleEditDraftChange}
                                onOutputChange={handleEditOutputChange}
                                onChartUpdated={chartId =>
                                    void handleChartUpdated(chartId)
                                }
                            />
                        )}
                </>
            )}

            {showDatasetPicker && (
                <SelectDatasetForChartModal
                    datasets={datasetsQuery.data}
                    onSelect={handleDatasetSelect}
                    onClose={() => {
                        dispatch(setShowDatasetPicker(false));
                        if (!createDraft) {
                            navigate(chartsWorkspaceIndexPath);
                        }
                    }}
                />
            )}
        </section>
    );
};
