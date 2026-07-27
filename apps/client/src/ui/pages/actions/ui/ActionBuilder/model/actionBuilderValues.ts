import type { ActionEffect, ActionParameterType } from '@/core/entities/action';

import { isDayOfWeekValue } from '@/shared/lib/dayOfWeek';

import type { ActionValueMappingDraft } from './actionBuilderDraft';

export const labelToActionBuilderKey = (label: string): string =>
    label
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9а-яё_]/g, '');

export const valueToActionBuilderDraftString = (value: unknown) => {
    if (value === undefined || value === null) {
        return '';
    }

    if (typeof value === 'string') {
        return value;
    }

    return JSON.stringify(value);
};

export const parseActionBuilderDraftValue = (
    type: ActionParameterType,
    value: string
): unknown => {
    const trimmed = value.trim();

    if (trimmed === '') {
        return undefined;
    }

    if (type === 'number') {
        const numberValue = Number(trimmed);
        if (!Number.isFinite(numberValue)) {
            throw new Error('Значение параметра по умолчанию должно быть числом.');
        }

        return numberValue;
    }

    if (type === 'bool') {
        return trimmed === 'true';
    }

    if (type === 'day_of_week' && !isDayOfWeekValue(trimmed)) {
        throw new Error('Значение параметра по умолчанию должно быть днём недели.');
    }

    return trimmed;
};

export const parseActionBuilderLiteralValue = (value: string) => {
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

export const actionBuilderValuesToMap = (
    values: ActionValueMappingDraft[],
    effectKind: ActionEffect['kind']
) =>
    values.reduce<ActionEffect['values']>((acc, value) => {
        const columnKey = value.columnKey.trim();
        if (!columnKey) {
            return acc;
        }

        if (value.sourceKind === 'parameter') {
            acc[columnKey] = {
                kind: 'parameter',
                key: value.parameterKey,
                operation: effectKind === 'updateRowsByMatch' ? value.operation : '=',
            };
        } else if (value.sourceKind === 'literal') {
            acc[columnKey] = {
                kind: 'literal',
                value: parseActionBuilderLiteralValue(value.literalValue),
                operation: effectKind === 'updateRowsByMatch' ? value.operation : '=',
            };
        } else {
            acc[columnKey] = {
                kind: 'computed',
                leftParameterKey: value.leftParameterKey,
                operation: value.computedOperation,
                rightParameterKey: value.rightParameterKey,
            };
        }

        return acc;
    }, {});
