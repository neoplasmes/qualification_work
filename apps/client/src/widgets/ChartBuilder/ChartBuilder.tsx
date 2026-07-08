import type { ChartConfig, ChartResponse, ChartType } from '@qualification-work/types';
import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useState,
    type ReactNode,
    type SubmitEventHandler,
} from 'react';
import { createPortal } from 'react-dom';

import {
    useCreateChartMutation,
    usePreviewChartDataMutation,
    useUpdateChartMutation,
} from '@/features/buildChart';

import type { DatasetMetadata } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { StatusMessage } from '@/shared/ui';

import {
    chartDefinitions,
    createChartBuilderOutput,
    type ChartBuilderDraft,
    type ChartBuilderOutput,
    type ChartTypeDefinition,
} from './model';
import {
    AppearanceSection,
    BuilderActions,
    ChartBuilderPreview,
    PreviewActions,
} from './ui';

import styles from './ChartBuilder.module.scss';

export type ChartBuilderProps = {
    orgId: string;
    selectedDataset: DatasetMetadata;
    /** what is configured in the builder so far */
    value: ChartBuilderDraft;
    editChartId?: string;
    /** element, where buttons save/edit/preview etc shall be rendered */
    actionsContainer: HTMLElement | null;
    onChange: (draft: ChartBuilderDraft) => void;
    onOutputChange?: (output: ChartBuilderOutput) => void;
    onChartCreated?: (chartId: string) => void;
    onChartUpdated?: (chartId: string) => void;
};

type PreviewState = {
    config: ChartConfig;
    data: ChartResponse;
} | null;

export const ChartBuilder = ({
    orgId,
    selectedDataset,
    value,
    editChartId,
    actionsContainer,
    onChange,
    onOutputChange,
    onChartCreated,
    onChartUpdated,
}: ChartBuilderProps) => {
    const formId = useId();
    const editMode = Boolean(editChartId);
    const [chartError, setChartError] = useState('');
    const [preview, setPreview] = useState<PreviewState>(null);
    const [previewChart, previewState] = usePreviewChartDataMutation();
    const [createChart, createChartState] = useCreateChartMutation();
    const [updateChart, updateChartState] = useUpdateChartMutation();
    const isSaving = editMode ? updateChartState.isLoading : createChartState.isLoading;
    const definition = chartDefinitions[value.chartType] as ChartTypeDefinition<object>;

    const currentOutput = useMemo(
        () => createChartBuilderOutput(value, selectedDataset.columns, editMode),
        [editMode, selectedDataset.columns, value]
    );

    useEffect(() => {
        onOutputChange?.(currentOutput);
    }, [currentOutput, onOutputChange]);

    const handleChartDraftChange = useCallback(
        (chartDraft: object) => {
            onChange({
                ...value,
                chartDraft: chartDraft as ChartBuilderDraft['chartDraft'],
            });
        },
        [onChange, value]
    );

    const handleChartNameChange = useCallback(
        (chartName: string) => {
            onChange({ ...value, chartName });
        },
        [onChange, value]
    );

    const handleChartColorChange = useCallback(
        (chartColor: string) => {
            onChange({ ...value, chartColor });
        },
        [onChange, value]
    );

    const handleChartTypeChange = useCallback(
        (chartType: ChartType) => {
            if (chartType === value.chartType) {
                return;
            }

            onChange({
                ...value,
                chartType,
                chartDraft: chartDefinitions[chartType].createDraft(),
            });
            setChartError('');
            setPreview(null);
        },
        [onChange, value]
    );

    const saveChartConfig = async (config: ChartConfig, output: ChartBuilderOutput) => {
        const fallbackName = `${selectedDataset.dataset.name} ${output.chartType}`;
        const name = output.chartName.trim() || fallbackName;

        try {
            if (editChartId) {
                await updateChart({
                    chartId: editChartId,
                    name,
                    chartType: output.chartType,
                    config,
                }).unwrap();
                onChartUpdated?.(editChartId);
            } else {
                const chart = await createChart({
                    orgId,
                    datasetId: selectedDataset.dataset.id,
                    name,
                    chartType: output.chartType,
                    config,
                }).unwrap();
                onChartCreated?.(chart.id);
            }
        } catch (error) {
            setChartError(getApiErrorMessage(error, 'Unable to save this chart.'));
        }
    };

    const handlePreview: SubmitEventHandler<HTMLFormElement> = event => {
        event.preventDefault();

        const config = currentOutput.config;

        if (!config) {
            setChartError(currentOutput.error);

            return;
        }

        void previewChart({
            datasetId: selectedDataset.dataset.id,
            chartType: currentOutput.chartType,
            config,
        })
            .unwrap()
            .then(data => {
                setChartError('');
                setPreview({ config, data });
            })
            .catch(error => {
                setChartError(getApiErrorMessage(error, 'Unable to preview this chart.'));
            });
    };

    const handleSave = () => {
        if (!preview) {
            return;
        }

        void saveChartConfig(preview.config, currentOutput);
    };

    const handleSaveWithoutPreview = () => {
        if (!currentOutput.config) {
            setChartError(currentOutput.error);

            return;
        }

        void saveChartConfig(currentOutput.config, currentOutput);
    };

    let content: ReactNode;
    let actions: ReactNode;

    if (preview) {
        content = (
            <ChartBuilderPreview
                chartError={chartError}
                columns={selectedDataset.columns}
                editMode={editMode}
                output={currentOutput}
                previewConfig={preview.config}
                previewData={preview.data}
                selectedDataset={selectedDataset}
                onChartNameChange={handleChartNameChange}
            />
        );

        actions = (
            <PreviewActions
                editMode={editMode}
                isSaving={isSaving}
                onBackToConfig={() => {
                    setChartError('');
                    setPreview(null);
                }}
                onSave={handleSave}
            />
        );
    } else {
        content = (
            <>
                <AppearanceSection
                    editMode={editMode}
                    selectedDataset={selectedDataset}
                    value={value}
                    onNameChange={handleChartNameChange}
                    onColorChange={handleChartColorChange}
                    onTypeChange={handleChartTypeChange}
                />

                <definition.Settings
                    config={definition.config}
                    selectedDataset={selectedDataset}
                    editMode={editMode}
                />

                {chartError && (
                    <StatusMessage tone="error" className={styles['error']}>
                        {chartError}
                    </StatusMessage>
                )}
            </>
        );

        actions = (
            <BuilderActions
                canPreview={currentOutput.canPreview}
                editMode={editMode}
                isSaving={isSaving}
                formId={formId}
                onSaveWithoutPreview={handleSaveWithoutPreview}
                previewLoading={previewState.isLoading}
            />
        );
    }

    return (
        <definition.config.Root
            key={value.chartType}
            id={formId}
            className={styles['form']}
            data-flex
            aria-label={editMode ? 'Edit chart' : 'Add chart'}
            value={value.chartDraft as object}
            onChange={handleChartDraftChange}
            onSubmit={handlePreview}
        >
            {content}
            {actionsContainer && createPortal(actions, actionsContainer)}
        </definition.config.Root>
    );
};
