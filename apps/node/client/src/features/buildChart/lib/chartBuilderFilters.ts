import type { FilterClause, FilterOperation } from '@/entities/chart';
import type { DatasetColumn } from '@/entities/dataset';

const parsePrimitiveValue = (rawValue: string, dataType: DatasetColumn['dataType']) => {
    const value = rawValue.trim();

    if (dataType === 'number') {
        return Number(value);
    }

    if (dataType === 'bool') {
        return value.toLowerCase() === 'true';
    }

    return value;
};

export const buildFilter = (
    column: DatasetColumn,
    operation: FilterOperation,
    rawValue: string
): FilterClause => {
    if (operation === 'is_null' || operation === 'not_null') {
        return { columnId: column.id, op: operation };
    }

    if (operation === 'between') {
        const parts = rawValue
            .split(',')
            .map(part => part.trim())
            .filter(Boolean);

        return {
            columnId: column.id,
            op: operation,
            value: parts
                .slice(0, 2)
                .map(part => parsePrimitiveValue(part, column.dataType)),
        };
    }

    if (operation === 'in' || operation === 'nin') {
        return {
            columnId: column.id,
            op: operation,
            value: rawValue
                .split(',')
                .map(part => part.trim())
                .filter(Boolean)
                .map(part => parsePrimitiveValue(part, column.dataType)),
        };
    }

    return {
        columnId: column.id,
        op: operation,
        value: parsePrimitiveValue(rawValue, column.dataType),
    };
};
