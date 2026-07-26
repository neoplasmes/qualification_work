import { z } from 'zod';

const valueOperation = z.enum(['=', '+', '-', '*', '/']);
const computedOperation = z.enum(['+', '-', '*', '/']);
const values = z.record(
    z.string(),
    z.discriminatedUnion('kind', [
        z.object({
            kind: z.literal('literal'),
            value: z.unknown(),
            operation: valueOperation.optional(),
        }),
        z.object({
            kind: z.literal('parameter'),
            key: z.string(),
            operation: valueOperation.optional(),
        }),
        z.object({
            kind: z.literal('computed'),
            leftParameterKey: z.string(),
            operation: computedOperation,
            rightParameterKey: z.string(),
        }),
    ])
);
export const actionSchema = z.object({
    id: z.string(),
    orgId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    archivedAt: z.string().nullable(),
    parameters: z.array(
        z.object({
            key: z.string(),
            label: z.string(),
            type: z.enum(['string', 'number', 'bool', 'date', 'day_of_week']),
            required: z.boolean().optional(),
            hidden: z.boolean().optional(),
            defaultValue: z.unknown().optional(),
        })
    ),
    effects: z.array(
        z.discriminatedUnion('kind', [
            z.object({ kind: z.literal('insertRow'), datasetId: z.string(), values }),
            z.object({
                kind: z.literal('updateRowsByMatch'),
                datasetId: z.string(),
                values,
                maxRows: z.number().optional(),
                match: z.object({
                    columnKey: z.string(),
                    parameterKey: z.string().optional(),
                    source: z
                        .discriminatedUnion('kind', [
                            z.object({ kind: z.literal('literal'), value: z.unknown() }),
                            z.object({ kind: z.literal('parameter'), key: z.string() }),
                        ])
                        .optional(),
                }),
            }),
        ])
    ),
});
const snapshot = z.object({
    rowId: z.string(),
    rowIndex: z.number(),
    data: z.record(z.string(), z.unknown()),
});
export const actionRunSchema = z.object({
    id: z.string(),
    actionId: z.string(),
    orgId: z.string(),
    userId: z.string(),
    parameters: z.record(z.string(), z.unknown()),
    status: z.enum(['success', 'failed']),
    errorMessage: z.string().nullable(),
    executedAt: z.string(),
    changes: z.array(
        z.discriminatedUnion('kind', [
            z.object({
                kind: z.literal('insertRow'),
                datasetId: z.string(),
                rowId: z.string(),
                rowIndex: z.number(),
                data: z.record(z.string(), z.unknown()),
            }),
            z.object({
                kind: z.literal('updateRowsByMatch'),
                datasetId: z.string(),
                match: z.object({ columnKey: z.string(), value: z.unknown() }),
                rowIds: z.array(z.string()),
                before: z.array(snapshot),
                after: z.array(snapshot),
            }),
        ])
    ),
});
