import type { DatasetColumn } from '@/core/entities/datasetColumn';
import type { ChartConfig, ChartType } from '@qualification-work/types';

import { DEFAULT_CHART_COLOR, getChartColorFromConfig } from '@/entities/chart';

import type { ChartBuilderOutput } from './chartBuilderTypes';
import { chartDefinitions, type ChartTypeDraft } from './chartDefinitions';

export type ChartBuilderDraft = {
    chartName: string;
    chartColor: string;
    chartType: ChartType;
    chartDraft: ChartTypeDraft;
};

export type { ChartBuilderOutput } from './chartBuilderTypes';

export const createChartBuilderDraft = (
    overrides?: Partial<ChartBuilderDraft>
): ChartBuilderDraft => {
    const chartType = overrides?.chartType ?? 'bar';
    const definition = chartDefinitions[chartType];

    return {
        chartName: '',
        chartColor: DEFAULT_CHART_COLOR,
        chartType,
        chartDraft: definition.createDraft(),
        ...overrides,
    };
};

export const configToBuilderDraft = (
    config: ChartConfig,
    chartType: ChartType
): Partial<ChartBuilderDraft> => ({
    chartType,
    chartColor: getChartColorFromConfig(config),
    chartDraft: chartDefinitions[chartType].configToDraft(config) as ChartTypeDraft,
});

export const createChartBuilderOutput = (
    draft: ChartBuilderDraft,
    columns: DatasetColumn[],
    editMode: boolean
): ChartBuilderOutput =>
    chartDefinitions[draft.chartType].createOutput({
        draft: draft.chartDraft as never,
        appearance: {
            chartName: draft.chartName,
            chartColor: draft.chartColor,
            chartType: draft.chartType,
        },
        columns,
        editMode,
    });
