import type { ActionParameterType } from '@qualification-work/types';

const valueTypePlaceholders: Record<ActionParameterType, string> = {
    string: 'текст',
    number: 'число',
    date: 'дата, ДД-ММ-ГГГГ',
    bool: 'да или нет',
    day_of_week: 'день недели, например пн',
};

export const getValueTypePlaceholder = (type: ActionParameterType) =>
    valueTypePlaceholders[type];
