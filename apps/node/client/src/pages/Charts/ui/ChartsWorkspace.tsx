import { skipToken } from '@reduxjs/toolkit/query';
import { Eye, PencilLine } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

import {
    WorkspaceModeTabs,
    type WorkspaceModeTabOption,
} from '@/widgets/WorkspaceModeTabs';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import {
    configToBuilderFields,
    createChartBuilderFields,
    type ChartBuilderFields,
} from '@/features/buildChart';

import { useGetChartQuery, useListChartsQuery } from '@/entities/chart';
import { useListDatasetsQuery, type DatasetMetadata } from '@/entities/dataset';

import { useHasOverflow } from '@/shared/lib/useHasOverflow';
import { PanelPlaceholder, StatusMessage } from '@/shared/ui';

import { chartsTestIds } from '../const';
import { chartsWorkspaceIndexPath, getChartWorkspaceUrl } from '../lib';
import {
    clearChartEditDraft,
    selectBuilderDatasetId,
    selectChart,
    selectChartEditDraft,
    selectChartsWorkspaceMode,
    selectSelectedChartId,
    selectShowDatasetPicker,
    setBuilderDatasetId,
    setChartEditDraft,
    setChartsWorkspaceMode,
    setShowDatasetPicker,
    type ChartsWorkspaceMode,
} from '../model';
import { useChartDataResult, useChartsWorkspaceRouteSync } from './lib';
import {
    CreateChartBuilderSection,
    EditChartBuilderSection,
} from './ui/ChartBuilderSection';
import { CreateChartModal } from './ui/CreateChartModal';
import { SavedChartDetails } from './ui/SavedChartDetails';

import styles from './ChartsPage.module.scss';

const CHARTS_WORKSPACE_MODE_TABS = [
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

export const ChartsWorkspace = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const workspaceRef = useRef<HTMLElement>(null);

    const selectedChartId = useSelector(selectSelectedChartId);
    const builderDatasetId = useSelector(selectBuilderDatasetId);
    const showDatasetPicker = useSelector(selectShowDatasetPicker);
    const workspaceMode = useSelector(selectChartsWorkspaceMode);
    const editDraft = useSelector(selectChartEditDraft);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const selectedChartQuery = useGetChartQuery(selectedChartId ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);

    useHasOverflow(workspaceRef);
    useChartsWorkspaceRouteSync({
        selectedChartId,
        builderDatasetId,
        showDatasetPicker,
        workspaceMode,
    });

    const selectedChart = selectedChartQuery.data ?? null;
    const chartData = useChartDataResult(selectedChart?.id ?? null, workspaceMode);

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

    const savedEditFields = useMemo(
        () =>
            selectedChart
                ? createChartBuilderFields({
                      ...configToBuilderFields(
                          selectedChart.config,
                          selectedChart.chartType
                      ),
                      chartName: selectedChart.name,
                  })
                : null,
        [selectedChart]
    );
    const editFields =
        selectedChart && editDraft?.chartId === selectedChart.id
            ? editDraft.fields
            : savedEditFields;

    const handleDatasetSelect = (dataset: DatasetMetadata) => {
        navigate(chartsWorkspaceIndexPath);
        dispatch(setBuilderDatasetId(dataset.dataset.id));
    };

    const handleChartCreated = async (chartId: string) => {
        await chartsQuery.refetch();
        dispatch(setBuilderDatasetId(null));
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

    const handleEditFieldsChange = (fields: ChartBuilderFields) => {
        if (!selectedChart) {
            return;
        }

        dispatch(setChartEditDraft({ chartId: selectedChart.id, fields }));
    };

    const handleChartUpdated = async (chartId: string) => {
        await selectedChartQuery.refetch();
        await chartsQuery.refetch();
        dispatch(clearChartEditDraft(chartId));
    };

    return (
        <>
            <section
                ref={workspaceRef}
                className={styles['panel']}
                data-stack="v"
                data-gap="md"
                data-flex
                data-test-id={chartsTestIds.workspace}
                aria-label="Chart details"
            >
                {!selectedChartId && !builderDataset && (
                    <PanelPlaceholder>
                        Select a chart or create a new one.
                    </PanelPlaceholder>
                )}

                {selectedChartId && selectedChartQuery.isLoading && (
                    <StatusMessage>Loading chart...</StatusMessage>
                )}

                {selectedChartId && selectedChartQuery.isError && (
                    <StatusMessage tone="error">Unable to load this chart.</StatusMessage>
                )}

                {builderDataset && org && (
                    <CreateChartBuilderSection
                        orgId={org.id}
                        dataset={builderDataset}
                        onChangeDataset={() => dispatch(setShowDatasetPicker(true))}
                        onCancel={() => dispatch(setBuilderDatasetId(null))}
                        onChartCreated={chartId => void handleChartCreated(chartId)}
                    />
                )}

                {selectedChart && !builderDataset && (
                    <>
                        <WorkspaceModeTabs
                            value={workspaceMode}
                            options={CHARTS_WORKSPACE_MODE_TABS}
                            layoutId="charts-workspace-mode"
                            onChange={handleWorkspaceModeChange}
                        />

                        {workspaceMode === 'view' && (
                            <SavedChartDetails
                                chart={selectedChart}
                                columns={editDataset?.columns ?? []}
                                chartResult={chartData.chartResult}
                                error={chartData.error}
                                isLoadingData={chartData.isFetching}
                            />
                        )}

                        {workspaceMode === 'edit' && !editDataset && (
                            <StatusMessage>Loading dataset...</StatusMessage>
                        )}

                        {workspaceMode === 'edit' && editDataset && org && editFields && (
                            <EditChartBuilderSection
                                orgId={org.id}
                                chart={selectedChart}
                                dataset={editDataset}
                                fields={editFields}
                                onFieldsChange={handleEditFieldsChange}
                                onChartUpdated={chartId =>
                                    void handleChartUpdated(chartId)
                                }
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
