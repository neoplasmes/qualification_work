import type {
    ChartConfig,
    HeatmapChartConfig,
    TimeGranularity,
} from '@qualification-work/types';

import { createConfig } from '@/features/Config';

import { getDefaultGranularity, type GroupingMode } from '../../common/model';

export type HeatmapChartDraft = {
    xColumnId: string;
    xGroupingMode: GroupingMode;
    xGranularity: TimeGranularity;
    xStep: number;
    yColumnId: string;
    yGroupingMode: GroupingMode;
    yGranularity: TimeGranularity;
    yStep: number;
    measureAggregate: HeatmapChartConfig['measure']['aggregate'];
    measureColumnId: string;
    measureValueFormat: NonNullable<HeatmapChartConfig['measure']['valueFormat']>;
    filterEnabled: boolean;
    filterColumnId: string;
    filterOperation: NonNullable<ChartConfig['filters']>[number]['op'];
    filterValue: string;
};

export const createHeatmapChartDraft = (): HeatmapChartDraft => ({
    xColumnId: '',
    xGroupingMode: 'none',
    xGranularity: getDefaultGranularity(),
    xStep: 10,
    yColumnId: '',
    yGroupingMode: 'none',
    yGranularity: getDefaultGranularity(),
    yStep: 10,
    measureAggregate: 'count',
    measureColumnId: '',
    measureValueFormat: '',
    filterEnabled: false,
    filterColumnId: '',
    filterOperation: 'eq',
    filterValue: '',
});

export const heatmapChartConfig = createConfig<HeatmapChartDraft>();
