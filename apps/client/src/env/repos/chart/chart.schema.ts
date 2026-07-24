import { z } from 'zod';

const chartTypeSchema = z.enum(['bar', 'line', 'pie', 'heatmap']);
const groupingSchema = z.union([
    z.object({
        kind: z.literal('time'),
        granularity: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']),
    }),
    z.object({ kind: z.literal('numeric'), step: z.number() }),
    z.null(),
]);
const dimensionSchema = z.object({
    columnId: z.string(),
    grouping: groupingSchema.optional(),
});
const measureSchema = z.object({
    columnId: z.string().optional(),
    aggregate: z.enum(['sum', 'avg', 'min', 'max', 'count', 'count_distinct']),
    alias: z.string().optional(),
    valueFormat: z.string().optional(),
});
const baseConfig = {
    style: z.object({ color: z.string().optional() }).optional(),
    filters: z
        .array(
            z.object({
                columnId: z.string(),
                op: z.enum([
                    'eq',
                    'neq',
                    'in',
                    'nin',
                    'gt',
                    'gte',
                    'lt',
                    'lte',
                    'between',
                    'is_null',
                    'not_null',
                ]),
                value: z.unknown().optional(),
            })
        )
        .optional(),
    limit: z.number().optional(),
    orderBy: z
        .object({
            ref: z.enum(['dim', 'measure']),
            index: z.number().optional(),
            dir: z.enum(['asc', 'desc']),
        })
        .optional(),
};
const seriesSchema = z.object({
    columnId: z.string(),
    topN: z.number().optional(),
    otherBucket: z.boolean().optional(),
});
const configSchema = z.discriminatedUnion('kind', [
    z.object({
        ...baseConfig,
        kind: z.literal('bar'),
        dimension: dimensionSchema,
        series: seriesSchema.optional(),
        measures: z.array(measureSchema),
    }),
    z.object({
        ...baseConfig,
        kind: z.literal('line'),
        dimension: dimensionSchema,
        series: seriesSchema.optional(),
        measures: z.array(measureSchema),
    }),
    z.object({
        ...baseConfig,
        kind: z.literal('pie'),
        slice: seriesSchema,
        measure: measureSchema,
    }),
    z.object({
        ...baseConfig,
        kind: z.literal('heatmap'),
        x: dimensionSchema,
        y: dimensionSchema,
        measure: measureSchema,
    }),
]);
export const chartSchema = z.object({
    id: z.string(),
    orgId: z.string(),
    datasetId: z.string(),
    name: z.string(),
    chartType: chartTypeSchema,
    config: configSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const chartDataSchema = z.object({
    kind: chartTypeSchema,
    columns: z.array(
        z.object({
            name: z.string(),
            role: z.enum(['dim', 'series', 'measure']),
            type: z.enum(['number', 'string', 'date', 'day_of_week']),
            timeGranularity: z
                .enum(['hour', 'day', 'week', 'month', 'quarter', 'year'])
                .optional(),
            valueFormat: z.string().optional(),
        })
    ),
    rows: z.array(z.array(z.union([z.string(), z.number(), z.null()]))),
    truncated: z.boolean(),
    aggregatedAt: z.string(),
});
