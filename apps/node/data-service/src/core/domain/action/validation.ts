import { ValidationError } from '@qualification-work/microservice-utils';
import type {
    ActionEffect,
    ActionMatchSource,
    ActionParameter,
    ActionValueOperation,
    ActionValueSource,
    ColumnDataType,
    DatasetColumn,
    UpdateRowsByMatchActionEffect,
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
            assertKnownMatchSource(effect.match, parameterKeys);

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

    if (source.kind === 'computed') {
        const left = getNumberParameter(source.leftParameterKey, parameters);
        const right = getNumberParameter(source.rightParameterKey, parameters);

        return calculate(left, source.operation, right);
    }

    return getParameter(source.key, parameters);
}

export function resolveMatchValue(
    match: UpdateRowsByMatchActionEffect['match'],
    parameters: Record<string, unknown>
): unknown {
    if (match.source) {
        return resolveMatchSource(match.source, parameters);
    }

    if (!match.parameterKey) {
        throw new ValidationError(['effects'], 'match source is required');
    }

    return getParameter(match.parameterKey, parameters);
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
        assertInsertOperation(effect, key, source);

        const value = resolveActionValue(source, parameters);
        const coerced = coerceValueByType(value, column.dataType, key);

        if (coerced !== null || !dropNulls) {
            result[key] = coerced;
        }
    }

    return result;
}

export function resolveAndCoerceUpdateEffectValues(
    effect: UpdateRowsByMatchActionEffect,
    columns: DatasetColumn[],
    parameters: Record<string, unknown>
): Record<string, { operation: ActionValueOperation; value: unknown }> {
    const columnByKey = new Map(columns.map(column => [column.key, column]));
    const result: Record<string, { operation: ActionValueOperation; value: unknown }> =
        {};

    for (const [key, source] of Object.entries(effect.values)) {
        const column = columnByKey.get(key);
        if (!column) {
            throw new ValidationError([key], `unknown column "${key}"`);
        }

        const operation = getUpdateOperation(source);
        const value = resolveActionValue(source, parameters);
        const coerced = coerceValueByType(value, column.dataType, key);

        if (operation !== '=' && column.dataType !== 'number') {
            throw new ValidationError(
                [key],
                `operation "${operation}" requires number column "${key}"`
            );
        }

        if (operation !== '=') {
            assertFiniteNumber(coerced, key);
        }

        result[key] = { operation, value: coerced };
    }

    return result;
}

function assertKnownValueSource(
    source: ActionValueSource,
    parameterKeys: Set<string>
): void {
    if (source.kind === 'literal') {
        return;
    }

    if (source.kind === 'computed') {
        assertKnownParameter(source.leftParameterKey, parameterKeys);
        assertKnownParameter(source.rightParameterKey, parameterKeys);

        return;
    }

    assertKnownParameter(source.key, parameterKeys);
}

function assertKnownMatchSource(
    match: UpdateRowsByMatchActionEffect['match'],
    parameterKeys: Set<string>
): void {
    if (match.source) {
        if (match.source.kind === 'parameter') {
            assertKnownParameter(match.source.key, parameterKeys);
        }

        return;
    }

    if (!match.parameterKey) {
        throw new ValidationError(['effects'], 'match source is required');
    }

    assertKnownParameter(match.parameterKey, parameterKeys);
}

function assertKnownParameter(key: string, parameterKeys: Set<string>): void {
    if (!parameterKeys.has(key)) {
        throw new ValidationError(['effects'], `unknown parameter "${key}"`);
    }
}

function assertInsertOperation(
    effect: ActionEffect,
    columnKey: string,
    source: ActionValueSource
): void {
    if (
        effect.kind === 'insertRow' &&
        source.kind !== 'computed' &&
        (source.operation ?? '=') !== '='
    ) {
        throw new ValidationError(
            [columnKey],
            `insert value for "${columnKey}" does not support update operation`
        );
    }
}

function getUpdateOperation(source: ActionValueSource): ActionValueOperation {
    if (source.kind === 'computed') {
        return '=';
    }

    return source.operation ?? '=';
}

function resolveMatchSource(
    source: ActionMatchSource,
    parameters: Record<string, unknown>
): unknown {
    if (source.kind === 'literal') {
        return source.value;
    }

    return getParameter(source.key, parameters);
}

function getParameter(key: string, parameters: Record<string, unknown>): unknown {
    if (!Object.hasOwn(parameters, key)) {
        throw new ValidationError([key], `missing parameter "${key}"`);
    }

    return parameters[key];
}

function getNumberParameter(key: string, parameters: Record<string, unknown>): number {
    return assertFiniteNumber(getParameter(key, parameters), key);
}

function calculate(
    left: number,
    operation: Exclude<ActionValueOperation, '='>,
    right: number
): number {
    if (operation === '+') {
        return left + right;
    }
    if (operation === '-') {
        return left - right;
    }
    if (operation === '*') {
        return left * right;
    }
    if (right === 0) {
        throw new ValidationError(['effects'], 'division by zero');
    }

    return left / right;
}

function assertFiniteNumber(value: unknown, field: string): number {
    if (value === null || value === undefined || value === '') {
        throw new ValidationError([field], `expected number for "${field}"`);
    }

    const numberValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numberValue)) {
        throw new ValidationError([field], `expected number for "${field}"`);
    }

    return numberValue;
}
