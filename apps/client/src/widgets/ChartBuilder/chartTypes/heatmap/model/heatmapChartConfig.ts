import type { ChartConfig, TimeGranularity } from '@qualification-work/types';

import { createConfig } from '@/shared/ui/tools/Config';

import {
    createMeasureDraft,
    defaultGranularity,
    type GroupingMode,
    type MeasureDraft,
} from '../../common/model';

export type HeatmapChartDraft = {
    xColumnId: string;
    xGroupingMode: GroupingMode;
    xGranularity: TimeGranularity;
    xStep: number;
    yColumnId: string;
    yGroupingMode: GroupingMode;
    yGranularity: TimeGranularity;
    yStep: number;
    measures: MeasureDraft[];
    filterEnabled: boolean;
    filterColumnId: string;
    filterOperation: NonNullable<ChartConfig['filters']>[number]['op'];
    filterValue: string;
};

export const createHeatmapChartDraft = (): HeatmapChartDraft => ({
    xColumnId: '',
    xGroupingMode: 'none',
    xGranularity: defaultGranularity,
    xStep: 10,
    yColumnId: '',
    yGroupingMode: 'none',
    yGranularity: defaultGranularity,
    yStep: 10,
    measures: [createMeasureDraft()],
    filterEnabled: false,
    filterColumnId: '',
    filterOperation: 'eq',
    filterValue: '',
});

export const heatmapChartConfig = createConfig<HeatmapChartDraft>();
