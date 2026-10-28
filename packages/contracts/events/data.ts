import { z } from 'zod';

import { envelopeSchema } from './envelope.js';

export const datasetColumnRefSchema = z.object({
    key: z.string(),
    dataType: z.enum(['number', 'string', 'date', 'bool', 'day_of_week']),
    isAnalyzable: z.boolean(),
});

// carries the full dataset state so consumers can rebuild read models from a compacted topic
export const datasetChangedSchema = envelopeSchema(
    'DatasetChanged',
    z.object({
        name: z.string(),
        columns: z.array(datasetColumnRefSchema),
        dataVersion: z.number().int(),
    })
);

export const datasetDeletedSchema = envelopeSchema('DatasetDeleted', z.object({}));

export const dataDatasetEventSchema = z.discriminatedUnion('type', [
    datasetChangedSchema,
    datasetDeletedSchema,
]);

export const chartChangedSchema = envelopeSchema(
    'ChartChanged',
    z.object({
        datasetId: z.uuid(),
        name: z.string(),
    })
);

export const chartDeletedSchema = envelopeSchema('ChartDeleted', z.object({}));

export const analyticsChartEventSchema = z.discriminatedUnion('type', [
    chartChangedSchema,
    chartDeletedSchema,
]);

export type DatasetColumnRef = z.infer<typeof datasetColumnRefSchema>;
export type DatasetChangedEvent = z.infer<typeof datasetChangedSchema>;
export type DatasetDeletedEvent = z.infer<typeof datasetDeletedSchema>;
export type DataDatasetEvent = z.infer<typeof dataDatasetEventSchema>;
export type ChartChangedEvent = z.infer<typeof chartChangedSchema>;
export type ChartDeletedEvent = z.infer<typeof chartDeletedSchema>;
export type AnalyticsChartEvent = z.infer<typeof analyticsChartEventSchema>;
