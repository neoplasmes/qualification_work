import type { ActionEffect, ActionParameterType } from '@/entities/action';

import { isDayOfWeekValue } from '@/shared/lib/dayOfWeek';

import type { ActionValueMappingDraft } from '../model';

export const labelToKey = (label: string): string =>
    label
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9а-яё_]/g, '');

export const valueToDraftString = (value: unknown) => {
    if (value === undefined || value === null) {
        return '';
    }

    if (typeof value === 'string') {
        return value;
    }

    return JSON.stringify(value);
};

export const parseDraftValue = (type: ActionParameterType, value: string): unknown => {
    const trimmed = value.trim();

    if (trimmed === '') {
        return undefined;
    }

    if (type === 'number') {
        const numberValue = Number(trimmed);
        if (!Number.isFinite(numberValue)) {
            throw new Error(`Default value for ${type} parameter must be a number.`);
        }

        return numberValue;
    }

    if (type === 'bool') {
        return trimmed === 'true';
    }

    if (type === 'day_of_week' && !isDayOfWeekValue(trimmed)) {
        throw new Error(`Default value for ${type} parameter must be a weekday.`);
    }

    return trimmed;
};

export const parseLiteralValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
        return '';
    }

    try {
        return JSON.parse(trimmed) as unknown;
    } catch {
        return value;
    }
};

export const draftValuesToMap = (values: ActionValueMappingDraft[]) =>
    values.reduce<ActionEffect['values']>((acc, value) => {
        const columnKey = value.columnKey.trim();
        if (!columnKey) {
            return acc;
        }

        if (value.sourceKind === 'parameter') {
            acc[columnKey] = { kind: 'parameter', key: value.parameterKey };
        } else {
            acc[columnKey] = {
                kind: 'literal',
                value: parseLiteralValue(value.literalValue),
            };
        }

        return acc;
    }, {});
