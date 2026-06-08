export const isUniqueViolation = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505';

export const isForeignKeyViolation = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23503';

export const fkConstraintName = (error: unknown): string | undefined => {
    if (
        typeof error === 'object' &&
        error !== null &&
        'constraint' in error &&
        typeof error.constraint === 'string'
    ) {
        return error.constraint;
    }

    return undefined;
};
