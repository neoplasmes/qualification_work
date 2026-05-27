import type { ActionParameter, ActionParameterType } from '@/entities/action';

import { isDayOfWeekValue } from '@/shared/lib/dayOfWeek';

import { parseDraftValue, valueToDraftString } from './draftValues';

const numberInputPattern = /^-?(?:\d+)?(?:\.\d*)?$/;
const numberValuePattern = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/;
const dateInputPattern = /^(?:\d{0,2}|\d{2}-\d{0,2}|\d{2}-\d{2}-\d{0,4})$/;
const dateValuePattern = /^(\d{2})-(\d{2})-(\d{4})$/;
const isoDateValuePattern = /^(\d{4})-(\d{2})-(\d{2})/;
const dayOfWeekInputPattern = /^[a-zA-Zа-яА-ЯёЁ.]*$/;

const runValuePlaceholders: Record<ActionParameterType, string> = {
    string: 'text',
    number: 'number',
    date: 'date, DD-MM-YYYY',
    bool: 'boolean',
    day_of_week: 'weekday, e.g. Monday or пн',
};

const isValidDateValue = (value: string) => {
    const match = dateValuePattern.exec(value);
    if (!match) {
        return false;
    }

    const [, dayText, monthText, yearText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

const formatDateForRunInput = (value: unknown) => {
    const raw = valueToDraftString(value);
    const match = isoDateValuePattern.exec(raw);

    return match ? `${match[3]}-${match[2]}-${match[1]}` : raw;
};

const formatDateForRunPayload = (value: string) => {
    const match = dateValuePattern.exec(value.trim());

    return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

const getRunValueTypeError = (parameter: ActionParameter) => {
    if (parameter.type === 'number') {
        return `${parameter.label} expects a number.`;
    }
    if (parameter.type === 'date') {
        return `${parameter.label} expects a date in DD-MM-YYYY format.`;
    }
    if (parameter.type === 'day_of_week') {
        return `${parameter.label} expects a weekday.`;
    }
    if (parameter.type === 'bool') {
        return `${parameter.label} expects true or false.`;
    }

    return `${parameter.label} has an invalid value.`;
};

export const getDefaultRunValues = (parameters: ActionParameter[]) =>
    parameters.reduce<Record<string, string>>((acc, parameter) => {
        acc[parameter.key] =
            parameter.type === 'date'
                ? formatDateForRunInput(parameter.defaultValue)
                : valueToDraftString(parameter.defaultValue);

        return acc;
    }, {});

export const coerceRunValues = (
    parameters: ActionParameter[],
    values: Record<string, string>
) =>
    parameters.reduce<Record<string, unknown>>((acc, parameter) => {
        const raw = values[parameter.key] ?? '';
        const value = parameter.type === 'date' ? formatDateForRunPayload(raw) : raw;
        const parsed = parseDraftValue(parameter.type, value);
        if (parsed !== undefined || raw.trim() !== '') {
            acc[parameter.key] = parsed;
        }

        return acc;
    }, {});

export const getRunValuePlaceholder = (type: ActionParameterType) =>
    runValuePlaceholders[type];

export const isRunValueInputAllowed = (type: ActionParameterType, value: string) => {
    if (value === '' || type === 'string') {
        return true;
    }
    if (type === 'number') {
        return numberInputPattern.test(value);
    }
    if (type === 'date') {
        return dateInputPattern.test(value);
    }
    if (type === 'day_of_week') {
        return dayOfWeekInputPattern.test(value);
    }

    return value === 'true' || value === 'false';
};

export const validateRunValues = (
    parameters: ActionParameter[],
    values: Record<string, string>
) => {
    for (const parameter of parameters) {
        const value = (values[parameter.key] ?? '').trim();
        if (!value) {
            continue;
        }

        const valid =
            parameter.type === 'number'
                ? numberValuePattern.test(value) && Number.isFinite(Number(value))
                : parameter.type === 'date'
                  ? isValidDateValue(value)
                  : parameter.type === 'day_of_week'
                    ? isDayOfWeekValue(value)
                    : parameter.type === 'bool'
                      ? value === 'true' || value === 'false'
                      : true;

        if (!valid) {
            return getRunValueTypeError(parameter);
        }
    }

    return null;
};
