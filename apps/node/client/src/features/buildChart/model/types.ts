import type { FormEvent, RefObject } from 'react';

import type { ChartConfig, ChartResponse } from '@/entities/chart';
import type { DatasetColumn, DatasetMetadata } from '@/entities/dataset';

import type { ChartBuilderFields, ChartBuilderSetters } from '../lib';
import type { GroupingMode } from '../types';

export type DatasetChartBuilderProps = {
    orgId: string;
    selectedDataset: DatasetMetadata;
    onChartCreated?: (chartId: string) => void;
    editChartId?: string;
    initialFields?: Partial<ChartBuilderFields>;
    value?: ChartBuilderFields;
    onChange?: (fields: ChartBuilderFields) => void;
    onChartUpdated?: (chartId: string) => void;
};

export type ChartBuilderState = ChartBuilderFields & ChartBuilderSetters;

export type ChartBuilderDerivedState = {
    columns: DatasetColumn[];
    measureColumns: DatasetColumn[];
    secondMeasureColumns: DatasetColumn[];
    activeDimensionColumnId: string;
    activeHeatmapYColumnId: string;
    activeMeasureColumnId: string;
    activeSecondMeasureColumnId: string;
    activeSeriesColumnId: string;
    activeFilterColumn: DatasetColumn | undefined;
    dimGroupingModes: GroupingMode[];
    heatmapYGroupingModes: GroupingMode[];
    nullaryFilter: boolean;
    canPreview: boolean;
};

export type DatasetChartBuilderViewModel = {
    builderRef: RefObject<HTMLElement | null>;
    chartError: string;
    derived: ChartBuilderDerivedState;
    editMode: boolean;
    fields: ChartBuilderState;
    isSaving: boolean;
    previewData: ChartResponse | null;
    previewLoading: boolean;
    savedConfig: ChartConfig | null;
    selectedDataset: DatasetMetadata;
    step: 'config' | 'preview';
    onBackToConfig: () => void;
    onDimensionColumnChange: (columnId: string) => void;
    onHeatmapYColumnChange: (columnId: string) => void;
    onPreview: (event: FormEvent<HTMLFormElement>) => void;
    onSave: () => void;
    onSaveWithoutPreview: () => void;
};
