import type { ChartConfig, TimeGranularity } from '@qualification-work/types';

import { createConfig } from '@/features/Config';

import {
    createMeasureDraft,
    getDefaultGranularity,
    type GroupingMode,
    type MeasureDraft,
} from '../../common/model';

export type BarChartDraft = {
    dimensionColumnId: string;
    dimensionGroupingMode: GroupingMode;
    dimensionGranularity: TimeGranularity;
    dimensionStep: number;
    measures: MeasureDraft[];
    breakdownEnabled: boolean;
    breakdownColumnId: string;
    breakdownTopN: number;
    breakdownOtherBucket: boolean;
    filterEnabled: boolean;
    filterColumnId: string;
    filterOperation: NonNullable<ChartConfig['filters']>[number]['op'];
    filterValue: string;
};

export const createBarChartDraft = (): BarChartDraft => ({
    dimensionColumnId: '',
    dimensionGroupingMode: 'none',
    dimensionGranularity: getDefaultGranularity(),
    dimensionStep: 10,
    measures: [createMeasureDraft()],
    breakdownEnabled: false,
    breakdownColumnId: '',
    breakdownTopN: 8,
    breakdownOtherBucket: true,
    filterEnabled: false,
    filterColumnId: '',
    filterOperation: 'eq',
    filterValue: '',
});

export const barChartConfig = createConfig<BarChartDraft>();
