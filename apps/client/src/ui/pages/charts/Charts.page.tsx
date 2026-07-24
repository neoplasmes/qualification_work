import { useChartsPageActions, useChartsPageState } from '@/ui/pages/charts/model';
import {
    ChartBuilder,
    createChartBuilderDraft,
    type ChartBuilderDraft,
    type ChartBuilderOutput,
} from '@/ui/pages/charts/ui/ChartBuilder';
import { useActiveOrganization, useSession } from '@/ui/session';
import {
    WorkspaceModeTabs,
    type WorkspaceModeTabOption,
} from '@/ui/widgets/WorkspaceModeTabs';
import { Button, Divider } from '@qualification-work/design-system';
import { Eye, PencilLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { StatusMessage } from '@/shared/ui';

import { chartsTestIds } from './const';
import {
    chartsWorkspaceIndexPath,
    chartsWorkspaceNewPath,
    getChartWorkspaceUrl,
    useChartDataResult,
} from './lib';
import { useChartsWorkspaceRouteSync, type ChartsWorkspaceMode } from './model';
import { useChartsController } from './model/controller';
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
        acceptServer,
        changeDataset,
        reset,
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
    const createDraft = useChartsPageState(state => state.createDraft);
    const showDatasetPicker = useChartsPageState(state => state.showDatasetPicker);
    const workspaceMode = useChartsPageState(state => state.workspaceMode);
    const editDraft = useChartsPageState(state => state.editDraft);

    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    useChartsWorkspaceRouteSync();
    const controller = useChartsController({
        orgId: org?.id ?? '',
        chartId: selectedChartId,
        createDraft,
        editDraft,
        onSaved: chartId => {
            if (createDraft) {
                clearChartCreateDraft();
                selectChart(chartId);
                navigate(getChartWorkspaceUrl(chartId, 'view'));
            } else {
                clearChartEditDraft(chartId);
            }
        },
    });
    const {
        selected: selectedChartQuery,
        datasets: datasetsQuery,
        builderDataset,
        editDataset,
        draft: editBuilderDraft,
    } = controller;
    const selectedChart = selectedChartQuery.data ?? null;
    const chartTitle = selectedChart?.name.trim() || 'Untitled chart';
    const chartData = useChartDataResult(
        org?.id ?? '',
        selectedChart?.id ?? null,
        workspaceMode
    );

    useEffect(() => {
        if (selectedChart) {
            acceptServer(selectedChart);
        }
    }, [selectedChart, acceptServer]);

    const builderActions = {
        preview: controller.preview,
        previewLoading: controller.previewLoading,
        chartError: controller.error,
        isSaving: controller.isSaving,
        onPreview: () => void controller.previewChart(),
        onSave: (usePreview: boolean) => void controller.saveChart(usePreview),
        onBackToConfig: controller.backToConfig,
    };
    const handleDatasetSelect = (dataset: DatasetMetadata) => {
        if (createDraft) {
            changeDataset(dataset.dataset.id);
        } else {
            setChartCreateDraft({
                datasetId: dataset.dataset.id,
                draft: createChartBuilderDraft(),
                output: null,
            });
        }
        navigate(chartsWorkspaceNewPath);
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

    return (
        <section
            className={styles['panel']}
            data-stack="v"
            data-gap="sm"
            data-flex
            data-test-id={chartsTestIds.workspace}
            aria-label="Chart details"
        >
            {controller.syncError && (
                <StatusMessage tone="error">{controller.syncError}</StatusMessage>
            )}
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

            {selectedChartId && selectedChartQuery.isPending && (
                // TODO: create <SkeletonLoader /> component
                <StatusMessage>Loading chart...</StatusMessage>
            )}

            {selectedChartId && Boolean(selectedChartQuery.error) && (
                <StatusMessage tone="error">Unable to load this chart.</StatusMessage>
            )}

            {createDraft && builderDataset && org && (
                <CreateChartBuilderSection
                    builderActions={builderActions}
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
                        {workspaceMode === 'edit' && (
                            <Button
                                data-test-id={chartsTestIds.cancelEditButton}
                                onClick={() => {
                                    reset();
                                    controller.backToConfig();
                                    handleWorkspaceModeChange('view');
                                }}
                            >
                                Cancel edit
                            </Button>
                        )}
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
                                {...builderActions}
                                selectedDataset={editDataset}
                                editChartId={selectedChart.id}
                                value={editBuilderDraft}
                                actionsContainer={actionsEl}
                                onChange={handleEditDraftChange}
                                onOutputChange={handleEditOutputChange}
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
