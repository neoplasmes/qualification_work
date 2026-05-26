import { z } from 'zod';

const valueSourceSchema = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('parameter'),
        key: z.string().min(1).max(255),
    }),
    z.object({
        kind: z.literal('literal'),
        value: z.unknown(),
    }),
]);

const valuesSchema = z.record(z.string().min(1).max(255), valueSourceSchema);

const parameterSchema = z.object({
    key: z.string().min(1).max(255),
    label: z.string().min(1).max(255),
    type: z.enum(['string', 'number', 'date', 'bool', 'day_of_week']),
    required: z.boolean().optional(),
    defaultValue: z.unknown().optional(),
});

const insertRowEffectSchema = z.object({
    kind: z.literal('insertRow'),
    datasetId: z.uuid(),
    values: valuesSchema,
});

const updateRowsByMatchEffectSchema = z.object({
    kind: z.literal('updateRowsByMatch'),
    datasetId: z.uuid(),
    match: z.object({
        columnKey: z.string().min(1).max(255),
        parameterKey: z.string().min(1).max(255),
    }),
    values: valuesSchema,
    maxRows: z.number().int().min(1).max(500).optional(),
});

export const actionDefinitionSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(2000).nullable().optional(),
    parameters: z.array(parameterSchema).max(50),
    effects: z
        .array(
            z.discriminatedUnion('kind', [
                insertRowEffectSchema,
                updateRowsByMatchEffectSchema,
            ])
        )
        .min(1)
        .max(20),
});

export const createActionSchema = actionDefinitionSchema.extend({
    orgId: z.uuid(),
});

export const patchActionSchema = actionDefinitionSchema
    .partial()
    .refine(value => Object.keys(value).length > 0, { message: 'patch body is empty' });

export const executeActionSchema = z.object({
    parameters: z.record(z.string(), z.unknown()).default({}),
});

export const actionRunsQuerySchema = z.object({
    orgId: z.uuid(),
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(50),
});
