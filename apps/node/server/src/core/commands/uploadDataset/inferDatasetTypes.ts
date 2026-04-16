import type { ColumnDataType } from '@/core/entities/dataset';

type JSObjectsRowData = Record<string, unknown>;

// TODO: add more complex inference of dates (for example 12.02.2005 will not be processed correctly)
// TODO: and add more complex inference of bools like "yes", "no", "y", "n" etc. Actually this function has to be more clever at all
function inferColumnType(values: unknown[]): ColumnDataType {
    let hasString = false;
    let hasNumber = false;
    let hasDate = false;
    let hasBool = false;

    for (const value of values) {
        if (value === null || value === undefined || value === '') {
            continue;
        }

        if (typeof value === 'boolean') {
            hasBool = true;

            continue;
        }

        if (typeof value === 'number') {
            hasNumber = true;

            continue;
        }

        if (value instanceof Date) {
            hasDate = true;

            continue;
        }

        if (typeof value === 'string') {
            const loweredValue = value.toLowerCase().trim();

            if (loweredValue === 'true' || loweredValue === 'false') {
                hasBool = true;

                continue;
            }

            if (!Number.isNaN(Number(value))) {
                hasNumber = true;

                continue;
            }

            const parsedDate = new Date(value);
            if (!Number.isNaN(parsedDate.getTime())) {
                hasDate = true;
            } else {
                hasString = true;
            }

            continue;
        }

        hasString = true;
    }

    if (hasString) {
        return 'string';
    }
    if (hasDate && !hasNumber && !hasBool) {
        return 'date';
    }
    if (hasNumber && !hasDate && !hasBool) {
        return 'number';
    }
    if (hasBool && !hasNumber && !hasDate) {
        return 'bool';
    }

    return 'string';
}

/**
 * dumb fucntion to extract data types of incoming dataset
 *
 * @export
 * @param {JSObjectsRowData[]} rows
 * @returns {Array<{ key: string; dataType: ColumnDataType }>}
 */
export function inferDatasetTypes(
    rows: JSObjectsRowData[]
): Array<{ key: string; dataType: ColumnDataType }> {
    if (rows.length === 0) {
        return [];
    }

    const keys = Object.keys(rows[0]);
    const columnValues = new Map<string, unknown[]>();

    for (const key of keys) {
        columnValues.set(key, []);
    }

    for (const row of rows) {
        for (const key of keys) {
            columnValues.get(key)?.push(row[key]);
        }
    }

    return keys.map(key => ({
        key,
        dataType: inferColumnType(columnValues.get(key) ?? []),
    }));
}
