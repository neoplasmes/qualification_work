import type { Aggregate, FilterOperation, TimeGranularity } from '@/core/entities/chart';

export const aggregateLabels: Record<Aggregate, string> = {
    count: 'Количество',
    sum: 'Сумма',
    avg: 'Среднее',
    min: 'Минимум',
    max: 'Максимум',
    count_distinct: 'Уникальные значения',
};

export const granularityLabels: Record<TimeGranularity, string> = {
    hour: 'Час',
    day: 'День',
    week: 'Неделя',
    month: 'Месяц',
    quarter: 'Квартал',
    year: 'Год',
};

export const filterOpLabels: Record<FilterOperation, string> = {
    eq: '= равно',
    neq: '≠ не равно',
    gt: '> больше',
    gte: '≥ больше или равно',
    lt: '< меньше',
    lte: '≤ меньше или равно',
    in: 'в списке',
    nin: 'не в списке',
    between: 'между',
    is_null: 'пусто',
    not_null: 'не пусто',
};

// short forms used in inline summary sentences
export const filterOpShort: Record<FilterOperation, string> = {
    eq: '=',
    neq: '≠',
    gt: '>',
    gte: '≥',
    lt: '<',
    lte: '≤',
    in: 'в',
    nin: 'не в',
    between: 'между',
    is_null: 'пусто',
    not_null: 'не пусто',
};
