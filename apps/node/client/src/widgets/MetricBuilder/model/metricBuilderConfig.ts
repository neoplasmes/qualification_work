import type { MetricTargetDirection, MetricTimeBucket } from '@qualification-work/types';

import { createConfig, type ConfigBind } from '@/features/Config';

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

export const metricBuilderConfig = createConfig<
    MetricBuilderDraft,
    MetricBuilderOutput
>();

const createMetricBuilderBind = <K extends keyof MetricBuilderDraft>(
    key: K
): ConfigBind<MetricBuilderDraft, MetricBuilderDraft[K]> => ({
    get: draft => draft[key],
    set: (draft, value) => {
        draft[key] = value;
    },
});

export const metricBuilderBinds = {
    datasetId: createMetricBuilderBind('datasetId'),
    name: createMetricBuilderBind('name'),
    expression: createMetricBuilderBind('expression'),
    format: createMetricBuilderBind('format'),
    valueMultiplier: createMetricBuilderBind('valueMultiplier'),
    target: createMetricBuilderBind('target'),
    targetDirection: createMetricBuilderBind('targetDirection'),
    showTrend: createMetricBuilderBind('showTrend'),
    timeColumn: createMetricBuilderBind('timeColumn'),
    timeBucket: createMetricBuilderBind('timeBucket'),
} as const;

export const disableMetricTrendOutput = (draft: MetricBuilderDraft) => {
    draft.timeColumn = '';
    draft.timeBucket = '';
};
