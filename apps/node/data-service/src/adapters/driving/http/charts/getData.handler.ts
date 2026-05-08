import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import { ValidationError } from '@/core/errors';
import type { GetChartDataQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

const filterOverridesSchema = z.array(z.looseObject({})).optional();

export function createGetChartDataHandler(
    handler: GetChartDataQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const id = parseWithZod(z.uuid(), request.params.id);

        let filterOverrides: unknown = undefined;
        const raw = request.query.filterOverrides;
        if (raw) {
            const encoded = Array.isArray(raw) ? raw[0] : raw;

            try {
                filterOverrides = JSON.parse(
                    Buffer.from(encoded, 'base64url').toString('utf-8')
                );
            } catch {
                throw new ValidationError(['filterOverrides'], 'Invalid base64 encoding');
            }
        }

        const filters = parseWithZod(filterOverridesSchema, filterOverrides);

        const result = await handler.execute({
            chartId: id,
            filterOverrides: filters as never,
        });

        response.status(200).json(result);
    };
}
