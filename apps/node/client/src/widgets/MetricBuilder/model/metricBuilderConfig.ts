import type { MetricTargetDirection, MetricTimeBucket } from '@qualification-work/types';

import { createConfig } from '@/features/Config';

import type { DashboardMetricItem } from '@/entities/dashboard';

export type MetricBuilderDraft = {
    datasetId: string;
    name: string;
    expression: string;
    format: DashboardMetricItem['format'];
    valueMultiplier: string;
    target: string;
    targetDirection: MetricTargetDirection;
    showTrend: boolean;
    timeColumn: string;
    timeBucket: MetricTimeBucket | '';
};

export type MetricBuilderOutput = MetricBuilderDraft;

export const metricBuilderConfig = createConfig<MetricBuilderDraft>();

export const createMetricBuilderOutput = (
    draft: MetricBuilderDraft
): MetricBuilderOutput => {
    if (draft.showTrend) {
        return draft;
    }

    return {
        ...draft,
        timeColumn: '',
        timeBucket: '',
    };
};
