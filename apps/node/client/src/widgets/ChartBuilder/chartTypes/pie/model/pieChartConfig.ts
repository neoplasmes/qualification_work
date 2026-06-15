import type {
    ChartConfig,
    PieChartConfig,
    TimeGranularity,
} from '@qualification-work/types';

import { createConfig } from '@/features/Config';

import { getDefaultGranularity, type GroupingMode } from '../../common/model';

export type PieChartDraft = {
    dimensionColumnId: string;
    dimensionGroupingMode: GroupingMode;
    dimensionGranularity: TimeGranularity;
    dimensionStep: number;
    measureAggregate: PieChartConfig['measure']['aggregate'];
    measureColumnId: string;
    measureValueFormat: NonNullable<PieChartConfig['measure']['valueFormat']>;
    topN: number;
    filterEnabled: boolean;
    filterColumnId: string;
    filterOperation: NonNullable<ChartConfig['filters']>[number]['op'];
    filterValue: string;
};

export const createPieChartDraft = (): PieChartDraft => ({
    dimensionColumnId: '',
    dimensionGroupingMode: 'none',
    dimensionGranularity: getDefaultGranularity(),
    dimensionStep: 10,
    measureAggregate: 'count',
    measureColumnId: '',
    measureValueFormat: '',
    topN: 12,
    filterEnabled: false,
    filterColumnId: '',
    filterOperation: 'eq',
    filterValue: '',
});

export const pieChartConfig = createConfig<PieChartDraft>();
