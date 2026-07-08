export const datasetSourceTypes = ['csv', 'xlsx', 'manual'] as const;

export const datasetFileSourceTypes = ['csv', 'xlsx'] as const;

export const datasetColumnDataTypes = [
    'number',
    'string',
    'date',
    'bool',
    'day_of_week',
] as const;

export const mergeModes = ['append', 'merge'] as const;
