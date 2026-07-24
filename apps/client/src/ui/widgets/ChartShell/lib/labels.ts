import type { Aggregate, FilterOperation, TimeGranularity } from '@/core/entities/chart';

export const aggregateLabels: Record<Aggregate, string> = {
    count: 'Count',
    sum: 'Sum',
    avg: 'Average',
    min: 'Min',
    max: 'Max',
    count_distinct: 'Count unique',
};

export const granularityLabels: Record<TimeGranularity, string> = {
    hour: 'Hour',
    day: 'Day',
    week: 'Week',
    month: 'Month',
    quarter: 'Quarter',
    year: 'Year',
};

export const filterOpLabels: Record<FilterOperation, string> = {
    eq: '= equals',
    neq: '≠ not equals',
    gt: '> greater',
    gte: '≥ greater or equal',
    lt: '< less',
    lte: '≤ less or equal',
    in: 'in list',
    nin: 'not in list',
    between: 'between',
    is_null: 'is empty',
    not_null: 'is not empty',
};

// short forms used in inline summary sentences
export const filterOpShort: Record<FilterOperation, string> = {
    eq: '=',
    neq: '≠',
    gt: '>',
    gte: '≥',
    lt: '<',
    lte: '≤',
    in: 'in',
    nin: 'not in',
    between: 'between',
    is_null: 'is empty',
    not_null: 'is not empty',
};
