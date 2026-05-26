import type { ActionParameter } from '@/entities/action';

import { parseDraftValue, valueToDraftString } from './draftValues';

export const getDefaultRunValues = (parameters: ActionParameter[]) =>
    parameters.reduce<Record<string, string>>((acc, parameter) => {
        acc[parameter.key] = valueToDraftString(parameter.defaultValue);

        return acc;
    }, {});

export const coerceRunValues = (
    parameters: ActionParameter[],
    values: Record<string, string>
) =>
    parameters.reduce<Record<string, unknown>>((acc, parameter) => {
        const raw = values[parameter.key] ?? '';
        const parsed = parseDraftValue(parameter.type, raw);
        if (parsed !== undefined || raw.trim() !== '') {
            acc[parameter.key] = parsed;
        }

        return acc;
    }, {});
