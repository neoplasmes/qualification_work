import { useRef, useState, type FormEvent } from 'react';

import { type ChartConfig, type ChartResponse } from '@/entities/chart';

import { getApiErrorMessage } from '@/shared/api';
import { useHasOverflow } from '@/shared/lib/useHasOverflow';

import {
    useCreateChartMutation,
    usePreviewChartDataMutation,
    useUpdateChartMutation,
} from '../api';
import { chartRowLimit } from '../const';
import {
    buildChartConfig,
    buildFilter,
    buildGrouping,
    useChartBuilderState,
} from '../lib';
import type { DatasetChartBuilderProps, DatasetChartBuilderViewModel } from './types';
import { useChartBuilderDerivedState } from './useChartBuilderDerivedState';

export const useDatasetChartBuilder = ({
    orgId,
    selectedDataset,
    onChartCreated,
    editChartId,
    initialFields,
    value,
    onChange,
    onChartUpdated,
}: DatasetChartBuilderProps): DatasetChartBuilderViewModel => {
    const [step, setStep] = useState<'config' | 'preview'>('config');
    const [chartError, setChartError] = useState('');
    const [previewData, setPreviewData] = useState<ChartResponse | null>(null);
    const [savedConfig, setSavedConfig] = useState<ChartConfig | null>(null);
    const [previewChart, previewState] = usePreviewChartDataMutation();
    const [createChart, createChartState] = useCreateChartMutation();
    const [updateChart, updateChartState] = useUpdateChartMutation();
    const builderRef = useRef<HTMLElement>(null);
    const fields = useChartBuilderState({
        datasetId: selectedDataset.dataset.id,
        initialOverrides: initialFields,
        value,
        onChange,
    });
    const columns = selectedDataset.columns;
    const editMode = Boolean(editChartId);
    const derived = useChartBuilderDerivedState({ columns, fields, editMode });

    useHasOverflow(builderRef);

    const onDimensionColumnChange = (newId: string) => {
        const newType = columns.find(c => c.id === newId)?.dataType;
        fields.setDimensionColumnId(newId);
        if (
            (fields.dimensionGroupingMode === 'time' && newType !== 'date') ||
            (fields.dimensionGroupingMode === 'numeric' && newType !== 'number')
        ) {
            fields.setDimensionGroupingMode('none');
        }
    };

    const onHeatmapYColumnChange = (newId: string) => {
        const newType = columns.find(c => c.id === newId)?.dataType;
        fields.setHeatmapYColumnId(newId);
        if (
            (fields.heatmapYGroupingMode === 'time' && newType !== 'date') ||
            (fields.heatmapYGroupingMode === 'numeric' && newType !== 'number')
        ) {
            fields.setHeatmapYGroupingMode('none');
        }
    };

    const buildCurrentConfig = () => {
        if (
            fields.chartType === 'heatmap' &&
            derived.activeDimensionColumnId === derived.activeHeatmapYColumnId
        ) {
            setChartError('X and Y axes must be different columns.');

            return null;
        }

        if (!derived.canPreview) {
            setChartError('Choose columns included in analysis for this chart.');

            return null;
        }

        if (
            fields.filterEnabled &&
            !derived.nullaryFilter &&
            !fields.filterValue.trim()
        ) {
            setChartError('Fill filter value or turn the filter off.');

            return null;
        }

        if (fields.filterEnabled && fields.filterOperation === 'between') {
            const parts = fields.filterValue
                .split(',')
                .map(part => part.trim())
                .filter(Boolean);
            if (parts.length !== 2) {
                setChartError('Between filter expects two comma-separated values.');

                return null;
            }
        }

        const filter =
            fields.filterEnabled && derived.activeFilterColumn
                ? buildFilter(
                      derived.activeFilterColumn,
                      fields.filterOperation,
                      fields.filterValue
                  )
                : null;
        const effectiveDimGroupingMode = derived.dimGroupingModes.includes(
            fields.dimensionGroupingMode
        )
            ? fields.dimensionGroupingMode
            : 'none';
        const effectiveHeatmapYGroupingMode = derived.heatmapYGroupingModes.includes(
            fields.heatmapYGroupingMode
        )
            ? fields.heatmapYGroupingMode
            : 'none';

        setChartError('');

        return buildChartConfig({
            chartType: fields.chartType,
            chartColor: fields.chartColor,
            dimensionColumnId: derived.activeDimensionColumnId,
            dimensionGrouping: buildGrouping(
                effectiveDimGroupingMode,
                fields.dimensionGranularity,
                fields.dimensionStep
            ),
            heatmapYColumnId: derived.activeHeatmapYColumnId,
            heatmapYGrouping: buildGrouping(
                effectiveHeatmapYGroupingMode,
                fields.heatmapYGranularity,
                fields.heatmapYStep
            ),
            measures: (fields.chartType === 'pie' || fields.chartType === 'heatmap'
                ? fields.measures.slice(0, 1)
                : fields.measures
            ).map((measure, index) => ({
                aggregate: measure.aggregate,
                valueFormat: measure.valueFormat,
                columnId: derived.measures[index]?.activeColumnId ?? '',
            })),
            limit: chartRowLimit,
            topN: fields.topN,
            seriesEnabled:
                fields.seriesEnabled &&
                fields.chartType !== 'pie' &&
                fields.chartType !== 'heatmap',
            seriesColumnId: derived.activeSeriesColumnId,
            seriesTopN: fields.seriesTopN,
            seriesOtherBucket: fields.seriesOtherBucket,
            filter,
        });
    };

    const saveChartConfig = async (config: ChartConfig) => {
        const fallbackName = `${selectedDataset.dataset.name} ${fields.chartType}`;
        const name = fields.chartName.trim() || fallbackName;

        try {
            if (editChartId) {
                await updateChart({
                    chartId: editChartId,
                    name,
                    chartType: fields.chartType,
                    config,
                }).unwrap();
                onChartUpdated?.(editChartId);
            } else {
                const chart = await createChart({
                    orgId,
                    datasetId: selectedDataset.dataset.id,
                    name,
                    chartType: fields.chartType,
                    config,
                }).unwrap();
                onChartCreated?.(chart.id);
            }
        } catch (error) {
            setChartError(getApiErrorMessage(error, 'Unable to save this chart.'));
        }
    };

    const onPreview = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const config = buildCurrentConfig();
        if (!config) {
            return;
        }

        try {
            const data = await previewChart({
                datasetId: selectedDataset.dataset.id,
                chartType: fields.chartType,
                config,
            }).unwrap();

            setSavedConfig(config);
            setPreviewData(data);
            setStep('preview');
        } catch (error) {
            setChartError(getApiErrorMessage(error, 'Unable to preview this chart.'));
        }
    };

    const onSave = async () => {
        if (!savedConfig) {
            return;
        }

        await saveChartConfig(savedConfig);
    };

    const onSaveWithoutPreview = async () => {
        const config = buildCurrentConfig();
        if (!config) {
            return;
        }

        await saveChartConfig(config);
    };

    return {
        builderRef,
        chartError,
        derived,
        editMode,
        fields,
        isSaving: editMode ? updateChartState.isLoading : createChartState.isLoading,
        previewData,
        previewLoading: previewState.isLoading,
        savedConfig,
        selectedDataset,
        step,
        onBackToConfig: () => {
            setChartError('');
            setStep('config');
        },
        onDimensionColumnChange,
        onHeatmapYColumnChange,
        onPreview: event => void onPreview(event),
        onSave: () => void onSave(),
        onSaveWithoutPreview: () => void onSaveWithoutPreview(),
    };
};
