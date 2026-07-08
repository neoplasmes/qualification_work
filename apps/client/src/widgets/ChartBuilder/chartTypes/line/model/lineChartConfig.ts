import type { ChartConfig, TimeGranularity } from '@qualification-work/types';

import { createConfig } from '@/features/Config';

import {
    createMeasureDraft,
    defaultGranularity,
    type GroupingMode,
    type MeasureDraft,
} from '../../common/model';

export type LineChartDraft = {
    dimensionColumnId: string;
    dimensionGroupingMode: GroupingMode;
    dimensionGranularity: TimeGranularity;
    dimensionStep: number;
    measures: MeasureDraft[];
    breakdownEnabled: boolean;
    breakdownColumnId: string;
    breakdownTopN: number;
    filterEnabled: boolean;
    filterColumnId: string;
    filterOperation: NonNullable<ChartConfig['filters']>[number]['op'];
    filterValue: string;
};

export const createLineChartDraft = (): LineChartDraft => ({
    dimensionColumnId: '',
    dimensionGroupingMode: 'none',
    dimensionGranularity: defaultGranularity,
    dimensionStep: 10,
    measures: [createMeasureDraft()],
    breakdownEnabled: false,
    breakdownColumnId: '',
    breakdownTopN: 8,
    filterEnabled: false,
    filterColumnId: '',
    filterOperation: 'eq',
    filterValue: '',
});

export const lineChartConfig = createConfig<LineChartDraft>();
