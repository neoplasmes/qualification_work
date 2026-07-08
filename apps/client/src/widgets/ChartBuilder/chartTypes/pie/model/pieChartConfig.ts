import type { ChartConfig, TimeGranularity } from '@qualification-work/types';

import { createConfig } from '@/features/Config';

import {
    createMeasureDraft,
    defaultGranularity,
    type GroupingMode,
    type MeasureDraft,
} from '../../common/model';

export type PieChartDraft = {
    dimensionColumnId: string;
    dimensionGroupingMode: GroupingMode;
    dimensionGranularity: TimeGranularity;
    dimensionStep: number;
    measures: MeasureDraft[];
    topN: number;
    filterEnabled: boolean;
    filterColumnId: string;
    filterOperation: NonNullable<ChartConfig['filters']>[number]['op'];
    filterValue: string;
};

export const createPieChartDraft = (): PieChartDraft => ({
    dimensionColumnId: '',
    dimensionGroupingMode: 'none',
    dimensionGranularity: defaultGranularity,
    dimensionStep: 10,
    measures: [createMeasureDraft()],
    topN: 12,
    filterEnabled: false,
    filterColumnId: '',
    filterOperation: 'eq',
    filterValue: '',
});

export const pieChartConfig = createConfig<PieChartDraft>();
