import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { useChartsPageActions, useChartsPageState } from '@/ui/pages/charts/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import {
    WorkspaceModeTabs,
    type WorkspaceModeTabOption,
} from '@/ui/widgets/WorkspaceModeTabs';
import { Divider } from '@qualification-work/design-system';
import { skipToken } from '@reduxjs/toolkit/query';
import { Eye, PencilLine } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import {
    ChartBuilder,
    configToBuilderDraft,
    createChartBuilderDraft,
    type ChartBuilderDraft,
    type ChartBuilderOutput,
} from '@/widgets/ChartBuilder';

import { useGetChartQuery, useListChartsQuery } from '@/entities/chart';

import { StatusMessage } from '@/shared/ui';

import { chartsTestIds } from './const';
import {
    chartsWorkspaceIndexPath,
    chartsWorkspaceNewPath,
    getChartWorkspaceUrl,
    useChartDataResult,
} from './lib';
import { useChartsWorkspaceRouteSync, type ChartsWorkspaceMode } from './model';
import { CreateChartBuilderSection } from './ui/ChartBuilderSection';
import { SavedChartDetails } from './ui/SavedChartDetails';
import { SelectDatasetForChartModal } from './ui/SelectDatasetForChartModal';

import styles from './charts.page.module.css';

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
    const {
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
    } = useChartsPageActions();
    const navigate = useNavigate();
    const [actionsEl, setActionsEl] = useState<HTMLDivElement | null>(null);

    const selectedChartId = useChartsPageState(state => state.selectedChartId);
    const createDatasetId = useChartsPageState(
        state => state.createDraft?.datasetId ?? null
    );
    const createDraft = useChartsPageState(state => state.createDraft);
    const showDatasetPicker = useChartsPageState(state => state.showDatasetPicker);
    const workspaceMode = useChartsPageState(state => state.workspaceMode);
    const editDraft = useChartsPageState(state => state.editDraft);

    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const selectedChartQuery = useGetChartQuery(selectedChartId ?? skipToken);
    const dependencies = useDependencies();
    const datasetsQuery = useRead(
        dependencies.listDatasets,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );

    useChartsWorkspaceRouteSync();

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
        setChartCreateDraft({
            datasetId: dataset.dataset.id,
            draft: createChartBuilderDraft(),
            output: null,
        });
        navigate(chartsWorkspaceNewPath);
    };

    const handleChartCreated = async (chartId: string) => {
        await chartsQuery.refetch();

        clearChartCreateDraft();
        selectChart(chartId);

        navigate(getChartWorkspaceUrl(chartId, 'view'));
    };

    const handleWorkspaceModeChange = (mode: ChartsWorkspaceMode) => {
        if (!selectedChartId) {
            return;
        }

        setChartsWorkspaceMode(mode);
        navigate(getChartWorkspaceUrl(selectedChartId, mode));
    };

    const handleCreateDraftChange = (draft: ChartBuilderDraft) => {
        setChartCreateDraftValue(draft);
    };

    const handleCreateOutputChange = (output: ChartBuilderOutput) => {
        setChartCreateOutput(output);
    };

    const handleEditDraftChange = (draft: ChartBuilderDraft) => {
        if (!selectedChart) {
            return;
        }

        if (editDraft?.chartId === selectedChart.id) {
            setChartEditDraftValue({ chartId: selectedChart.id, draft });

            return;
        }

        setChartEditDraft({ chartId: selectedChart.id, draft, output: null });
    };

    const handleEditOutputChange = (output: ChartBuilderOutput) => {
        if (!selectedChart) {
            return;
        }

        setChartEditOutput({ chartId: selectedChart.id, output });
    };

    const handleChartUpdated = async (chartId: string) => {
        await selectedChartQuery.refetch();
        await chartsQuery.refetch();
        clearChartEditDraft(chartId);
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
                        setShowDatasetPicker(true);
                        navigate(chartsWorkspaceNewPath);
                    }}
                    onCancel={() => {
                        clearChartCreateDraft();
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

                    <Divider />

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
                        setShowDatasetPicker(false);
                        if (!createDraft) {
                            navigate(chartsWorkspaceIndexPath);
                        }
                    }}
                />
            )}
        </section>
    );
};
