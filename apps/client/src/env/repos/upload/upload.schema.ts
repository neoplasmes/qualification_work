import { z } from 'zod';

export const uploadSchema = z.object({ id: z.string().min(1) });
export const previewSchema = z.object({
    sessionId: z.string().min(1),
    expiresInMs: z.number().nonnegative(),
    statistics: z.object({
        totalFiles: z.number().nonnegative(),
        totalIncomingRows: z.number().nonnegative(),
        totalNewRows: z.number().nonnegative(),
        totalDuplicateRows: z.number().nonnegative(),
        existingRowCount: z.number().nonnegative(),
        copiedRows: z.number().nonnegative(),
        newColumns: z.array(
            z.object({
                key: z.string(),
                displayName: z.string().optional(),
                dataType: z.enum(['number', 'string', 'date', 'bool', 'day_of_week']),
            })
        ),
        commonColumns: z.array(z.string()),
    }),
    conflicts: z.array(
        z.object({
            rowKey: z.record(z.string(), z.unknown()),
            column: z.string(),
            oldValue: z.unknown(),
            newValue: z.unknown(),
        })
    ),
});
export const commitSchema = z.object({
    datasetId: z.string().min(1),
    insertedRows: z.number().nonnegative(),
    updatedRows: z.number().nonnegative(),
    skippedDuplicates: z.number().nonnegative(),
    copiedRows: z.number().nonnegative(),
});
