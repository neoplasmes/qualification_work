import type { ChartConfig, ChartType } from '@/core/entities/chart';
import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { defaultChartColor, getChartColorFromConfig } from '@/ui/widgets/ChartShell';

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
        chartColor: defaultChartColor,
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

export function resetChartDatasetBindings(draft: ChartBuilderDraft): ChartBuilderDraft {
    const chartDraft = { ...draft.chartDraft };
    for (const key of Object.keys(chartDraft)) {
        if (key.endsWith('ColumnId') || key === 'filterValue') {
            Object.assign(chartDraft, { [key]: '' });
        }
        if (key.endsWith('GroupingMode')) {
            Object.assign(chartDraft, { [key]: 'none' });
        }
    }
    chartDraft.measures = chartDraft.measures.map(measure => ({
        ...measure,
        columnId: '',
    }));
    chartDraft.filterEnabled = false;
    if ('breakdownEnabled' in chartDraft) {
        chartDraft.breakdownEnabled = false;
    }

    return { ...draft, chartDraft };
}
