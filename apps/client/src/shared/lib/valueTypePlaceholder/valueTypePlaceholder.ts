import type { ActionParameterType } from '@qualification-work/types';

const valueTypePlaceholders: Record<ActionParameterType, string> = {
    string: 'text',
    number: 'number',
    date: 'date, DD-MM-YYYY',
    bool: 'boolean',
    day_of_week: 'weekday, e.g. Monday or пн',
};

export const getValueTypePlaceholder = (type: ActionParameterType) =>
    valueTypePlaceholders[type];
