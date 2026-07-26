import { z } from 'zod';

const baseItem = {
    id: z.string(),
    layout: z.object({
        posX: z.number(),
        posY: z.number(),
        width: z.number(),
        height: z.number(),
    }),
};
export const dashboardItemSchema = z.discriminatedUnion('kind', [
    z.object({ ...baseItem, kind: z.literal('chart'), chartId: z.string() }),
    z.object({
        ...baseItem,
        kind: z.literal('metric'),
        datasetId: z.string(),
        name: z.string(),
        expression: z.string(),
        format: z.string(),
        valueMultiplier: z.number(),
        target: z.number().nullable(),
        targetDirection: z.enum(['higher', 'lower']).nullable(),
        showTrend: z.boolean(),
        timeColumn: z.string().nullable(),
        timeBucket: z.enum(['day', 'week', 'month']).nullable(),
        value: z.number().nullable().optional(),
        trend: z
            .array(z.object({ bucket: z.string(), value: z.number().nullable() }))
            .nullable()
            .optional(),
    }),
]);
export const dashboardSchema = z.object({
    id: z.string(),
    orgId: z.string(),
    name: z.string(),
    items: z.array(dashboardItemSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
});
