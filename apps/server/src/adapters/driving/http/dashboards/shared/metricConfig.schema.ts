import { z } from 'zod';

import { metricTargetDirections, metricTimeBuckets } from '@qualification-work/types';

/**
 * shared optional metric config fields for add and update payloads
 * spread into the metric object schema, defaults keep features off and auto
 */
export const metricConfigSchema = {
    target: z.number().nullable().default(null),
    targetDirection: z.enum(metricTargetDirections).nullable().default(null),
    showTrend: z.boolean().default(false),
    timeColumn: z.string().trim().min(1).nullable().default(null),
    timeBucket: z.enum(metricTimeBuckets).nullable().default(null),
};
