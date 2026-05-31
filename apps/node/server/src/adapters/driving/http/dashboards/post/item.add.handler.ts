import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';
import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';
import { metricFormats } from '@qualification-work/types';

import type { AddDashboardItemCommand } from '@/core/commands';

import { metricConfigSchema } from '@/adapters/driving/http/dashboards/shared';

import type { RequestHandlerType } from '@/shared/appState';

const heightSchema = z.number().int().min(1).max(64).optional();

const addItemSchema = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('chart'),
        chartId: z.uuid(),
        height: heightSchema,
    }),
    z.object({
        kind: z.literal('metric'),
        datasetId: z.uuid(),
        name: z.string().trim().min(1).max(255),
        expression: z.string().trim().min(1),
        format: z.enum(metricFormats),
        height: heightSchema,
        ...metricConfigSchema,
    }),
]);

const paramsSchema = z.object({ id: z.uuid() });

export function createAddItemHandler(
    addItem: AddDashboardItemCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const { id: dashboardId } = parseWithZod(paramsSchema, {
            id: request.params.id,
        });

        const body = await request.json();
        const input = parseWithZod(addItemSchema, body);

        const orgs = getInternalIdentity(request).orgs;

        const result = await addItem.execute(dashboardId, input, orgs);

        response.status(201).json(result);
    };
}
