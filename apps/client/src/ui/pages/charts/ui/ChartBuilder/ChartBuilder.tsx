import type {
    ChartConfig,
    ChartData as ChartResponse,
    ChartType,
} from '@/core/entities/chart';
import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    type ReactNode,
    type SubmitEventHandler,
} from 'react';
import { createPortal } from 'react-dom';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

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

import styles from './ChartBuilder.module.css';

export type ChartBuilderProps = {
    preview: { config: ChartConfig; data: ChartResponse } | null;
    previewLoading: boolean;
    chartError: string;
    isSaving: boolean;
    onPreview(): void;
    onSave(usePreview: boolean): void;
    onBackToConfig(): void;
    selectedDataset: DatasetMetadata;
    /** what is configured in the builder so far */
    value: ChartBuilderDraft;
    editChartId?: string;
    /** element, where buttons save/edit/preview etc shall be rendered */
    actionsContainer: HTMLElement | null;
    onChange: (draft: ChartBuilderDraft) => void;
    onOutputChange?: (output: ChartBuilderOutput) => void;
};

export const ChartBuilder = ({
    preview,
    previewLoading,
    chartError,
    isSaving,
    onPreview,
    onSave,
    onBackToConfig,
    selectedDataset,
    value,
    editChartId,
    actionsContainer,
    onChange,
    onOutputChange,
}: ChartBuilderProps) => {
    const formId = useId();
    const editMode = Boolean(editChartId);
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
            onBackToConfig();
        },
        [onBackToConfig, onChange, value]
    );

    const handlePreview: SubmitEventHandler<HTMLFormElement> = event => {
        event.preventDefault();
        onPreview();
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
                onBackToConfig={onBackToConfig}
                onSave={() => onSave(true)}
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
                onSaveWithoutPreview={() => onSave(false)}
                previewLoading={previewLoading}
            />
        );
    }

    return (
        <definition.config.Root
            key={value.chartType}
            id={formId}
            className={styles['form']}
            data-flex
            aria-label={editMode ? 'Изменение графика' : 'Новый график'}
            value={value.chartDraft as object}
            onChange={handleChartDraftChange}
            onSubmit={handlePreview}
        >
            <fieldset disabled={isSaving} className={styles['fields']}>
                {content}
            </fieldset>
            {actionsContainer && createPortal(actions, actionsContainer)}
        </definition.config.Root>
    );
};
