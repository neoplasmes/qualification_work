import type { ChartConfig, ChartType } from '@qualification-work/types';
import type { ComponentType } from 'react';

import type { DatasetColumn } from '@/entities/dataset';

import type { Config } from '@/shared/ui/tools/Config';

export type ChartBuilderAppearanceDraft = {
    chartName: string;
    chartColor: string;
    chartType: ChartType;
};

export type ChartBuilderOutput<T extends ChartConfig = ChartConfig> =
    ChartBuilderAppearanceDraft & {
        config: T | null;
        error: string;
        canPreview: boolean;
    };

/**
 * Input required to transform a chart-type draft into a chart builder output
 *
 * @template T - chart-type draft object shape
 */
export type ChartTypeOutputInput<T extends object> = {
    draft: T;
    appearance: ChartBuilderAppearanceDraft;
    columns: DatasetColumn[];
    editMode: boolean;
};

/**
 * Props shared by chart-type settings components
 *
 * @template T - chart-type draft object shape
 */
export type ChartTypeSettingsProps<T extends object> = {
    config: Config<T>;
    selectedDataset: {
        columns: DatasetColumn[];
    };
    editMode: boolean;
};

/**
 * Registry entry for a supported chart type
 *
 * @template T - chart-type draft object shape
 */
export type ChartTypeDefinition<T extends object> = {
    chartType: ChartType;
    label: string;
    config: Config<T>;
    createDraft: () => T;
    configToDraft: (config: ChartConfig) => T;
    createOutput: (input: ChartTypeOutputInput<T>) => ChartBuilderOutput;
    Settings: ComponentType<ChartTypeSettingsProps<T>>;
};
