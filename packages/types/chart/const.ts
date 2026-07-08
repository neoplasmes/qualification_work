export const chartTypes = ['bar', 'line', 'pie', 'heatmap'] as const;

export const timeGranularities = [
    'hour',
    'day',
    'week',
    'month',
    'quarter',
    'year',
] as const;

export const aggregates = [
    'sum',
    'avg',
    'min',
    'max',
    'count',
    'count_distinct',
] as const;

export const filterOperations = [
    'eq',
    'neq',
    'in',
    'nin',
    'gt',
    'gte',
    'lt',
    'lte',
    'between',
    'is_null',
    'not_null',
] as const;

export const chartResultColumnRoles = ['dim', 'series', 'measure'] as const;
