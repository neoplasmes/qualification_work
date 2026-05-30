import { ValidationError } from '@qualification-work/microservice-utils';
import type {
    ActionEffect,
    ActionParameter,
    ActionValueSource,
    ColumnDataType,
    DatasetColumn,
} from '@qualification-work/types';

import { coerceValueByType } from '@/core/commands/dataset/lib';

export function validateActionDefinition(
    parameters: ActionParameter[],
    effects: ActionEffect[]
): void {
    const parameterKeys = new Set<string>();

    for (const parameter of parameters) {
        if (parameterKeys.has(parameter.key)) {
            throw new ValidationError(
                ['parameters'],
                `duplicate parameter "${parameter.key}"`
            );
        }

        parameterKeys.add(parameter.key);
    }

    if (effects.length === 0) {
        throw new ValidationError(['effects'], 'action must have at least one effect');
    }

    for (const effect of effects) {
        if (Object.keys(effect.values).length === 0) {
            throw new ValidationError(['effects'], 'effect values cannot be empty');
        }

        for (const source of Object.values(effect.values)) {
            assertKnownValueSource(source, parameterKeys);
        }

        if (effect.kind === 'updateRowsByMatch') {
            if (!parameterKeys.has(effect.match.parameterKey)) {
                throw new ValidationError(
                    ['effects'],
                    `unknown match parameter "${effect.match.parameterKey}"`
                );
            }

            if (effect.maxRows !== undefined && effect.maxRows < 1) {
                throw new ValidationError(['effects'], 'maxRows must be at least 1');
            }
        }
    }
}

export function coerceActionParameters(
    definitions: ActionParameter[],
    raw: Record<string, unknown>
): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const parameter of definitions) {
        const hasValue = Object.hasOwn(raw, parameter.key);
        const value = hasValue ? raw[parameter.key] : parameter.defaultValue;

        if (value === undefined || value === null || value === '') {
            if (parameter.required) {
                throw new ValidationError(
                    [parameter.key],
                    `missing required parameter "${parameter.key}"`
                );
            }

            continue;
        }

        result[parameter.key] = coerceValueByType(
            value,
            parameter.type as ColumnDataType,
            parameter.key
        );
    }

    return result;
}

export function resolveActionValue(
    source: ActionValueSource,
    parameters: Record<string, unknown>
): unknown {
    if (source.kind === 'literal') {
        return source.value;
    }

    if (!Object.hasOwn(parameters, source.key)) {
        throw new ValidationError([source.key], `missing parameter "${source.key}"`);
    }

    return parameters[source.key];
}

export function assertEffectColumnsExist(
    effect: ActionEffect,
    columns: DatasetColumn[]
): void {
    const columnByKey = new Map(columns.map(column => [column.key, column]));

    for (const key of Object.keys(effect.values)) {
        if (!columnByKey.has(key)) {
            throw new ValidationError([key], `unknown column "${key}"`);
        }
    }

    if (effect.kind === 'updateRowsByMatch' && !columnByKey.has(effect.match.columnKey)) {
        throw new ValidationError(
            [effect.match.columnKey],
            `unknown match column "${effect.match.columnKey}"`
        );
    }
}

export function resolveAndCoerceEffectValues(
    effect: ActionEffect,
    columns: DatasetColumn[],
    parameters: Record<string, unknown>,
    dropNulls: boolean
): Record<string, unknown> {
    const columnByKey = new Map(columns.map(column => [column.key, column]));
    const result: Record<string, unknown> = {};

    for (const [key, source] of Object.entries(effect.values)) {
        const column = columnByKey.get(key);
        if (!column) {
            throw new ValidationError([key], `unknown column "${key}"`);
        }

        const value = resolveActionValue(source, parameters);
        const coerced = coerceValueByType(value, column.dataType, key);

        if (coerced !== null || !dropNulls) {
            result[key] = coerced;
        }
    }

    return result;
}

function assertKnownValueSource(
    source: ActionValueSource,
    parameterKeys: Set<string>
): void {
    if (source.kind !== 'parameter') {
        return;
    }

    if (!parameterKeys.has(source.key)) {
        throw new ValidationError(['effects'], `unknown parameter "${source.key}"`);
    }
}
