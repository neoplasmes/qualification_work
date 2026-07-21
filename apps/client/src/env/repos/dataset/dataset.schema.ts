import { z } from 'zod';

export const datasetSchema = z.object({
    id: z.string().min(1),
    orgId: z.string().min(1),
    name: z.string(),
    sourceType: z.enum(['csv', 'xlsx', 'manual']),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const columnSchema = z.object({
    id: z.string().min(1),
    datasetId: z.string().min(1),
    key: z.string(),
    displayName: z.string(),
    dataType: z.enum(['number', 'string', 'date', 'bool', 'day_of_week']),
    orderIndex: z.number().int().nonnegative(),
    isAnalyzable: z.boolean(),
});
export const rowSchema = z.object({
    id: z.string().min(1),
    datasetId: z.string().min(1),
    rowIndex: z.number().int().nonnegative(),
    data: z.record(z.string(), z.unknown()),
});
export const metadataSchema = z.object({
    dataset: datasetSchema,
    columns: z.array(columnSchema),
    totalRows: z.number().int().nonnegative(),
});
export const rowsPageSchema = z.object({
    rows: z.array(rowSchema),
    totalRows: z.number().int().nonnegative(),
    offset: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
});
