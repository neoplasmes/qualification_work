import type { MetricTimeBucket } from '@qualification-work/types';

import type { DashboardItem } from '@/entities/dashboard';
import type { DatasetColumn } from '@/entities/dataset';

type MetricItem = Extract<DashboardItem, { kind: 'metric' }>;

type MetricTrendDescription = {
    columnName: string;
    timeBucket: MetricTimeBucket;
};

const defaultTimeBucket: MetricTimeBucket = 'month';

export const getMetricTrendDescription = (
    item: MetricItem,
    columns: DatasetColumn[]
): MetricTrendDescription | null => {
    if (!item.showTrend) {
        return null;
    }

    const timeColumn = item.timeColumn
        ? columns.find(column => column.key === item.timeColumn)
        : columns.find(column => column.dataType === 'date');

    if (!timeColumn) {
        return null;
    }

    return {
        columnName: timeColumn.displayName || timeColumn.key,
        timeBucket: item.timeBucket ?? defaultTimeBucket,
    };
};
