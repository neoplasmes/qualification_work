import { ValidationError } from '@qualification-work/microservice-utils/errors';
import type { ColumnDataType } from '@qualification-work/types';

import { isDayOfWeekValue } from './dayOfWeek';
import { parseStrictDate } from './inferDatasetTypes';

/**
 * coerces a raw value into the storage shape for a column data type
 * null/undefined/empty string -> null (treated as missing in JSONB)
 *
 * @param value
 * @param dataType
 * @param columnKey used in error messages
 * @returns
 */
export function coerceValueByType(
    value: unknown,
    dataType: ColumnDataType,
    columnKey: string
): unknown {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    if (dataType === 'string') {
        return typeof value === 'string' ? value : String(value);
    }

    if (dataType === 'number') {
        if (typeof value === 'number' && !Number.isNaN(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const parsed = Number(value);
            if (!Number.isNaN(parsed)) {
                return parsed;
            }
        }

        throw new ValidationError(
            [columnKey],
            `expected number for column "${columnKey}"`
        );
    }

    if (dataType === 'bool') {
        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'string') {
            const lowered = value.toLowerCase().trim();
            if (lowered === 'true') {
                return true;
            }
            if (lowered === 'false') {
                return false;
            }
        }

        throw new ValidationError([columnKey], `expected bool for column "${columnKey}"`);
    }

    if (dataType === 'date') {
        if (value instanceof Date) {
            if (Number.isNaN(value.getTime())) {
                throw new ValidationError(
                    [columnKey],
                    `expected date for column "${columnKey}"`
                );
            }

            return value.toISOString();
        }

        if (typeof value === 'string') {
            const iso = parseStrictDate(value);
            if (iso !== undefined) {
                return iso;
            }
        }

        throw new ValidationError([columnKey], `expected date for column "${columnKey}"`);
    }

    if (dataType === 'day_of_week') {
        if (typeof value === 'string' && isDayOfWeekValue(value)) {
            return value.trim();
        }

        throw new ValidationError(
            [columnKey],
            `expected day_of_week for column "${columnKey}"`
        );
    }

    return value;
}
