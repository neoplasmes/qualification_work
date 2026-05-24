import type { ColumnDataType } from '@/core/domain';

type JSObjectsRowData = Record<string, unknown>;

// strict ISO 8601: date-only or date+time with optional timezone
const ISO_DATE_RE =
    /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
// European DD.MM.YYYY
const EU_DOT_RE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

const BOOL_STRINGS = new Set(['true', 'false', 'yes', 'no', 'y', 'n']);

/**
 * returns true only for strings that match a known strict date format
 * and represent a calendar-valid date (e.g. rejects Feb 30)
 *
 * @param s
 * @returns
 */
export function isStrictDate(s: string): boolean {
    if (ISO_DATE_RE.test(s)) {
        return !Number.isNaN(new Date(s).getTime());
    }

    const dmy = EU_DOT_RE.exec(s);
    if (!dmy) {
        return false;
    }

    const d = Number(dmy[1]);
    const m = Number(dmy[2]);
    const y = Number(dmy[3]);
    // use UTC to avoid local-timezone day-shift
    const ts = Date.UTC(y, m - 1, d);
    const date = new Date(ts);

    return (
        date.getUTCFullYear() === y &&
        date.getUTCMonth() === m - 1 &&
        date.getUTCDate() === d
    );
}

/**
 * parses a strict-format date string to ISO 8601 (undefined if invalid)
 *
 * @param s
 * @returns
 */
export function parseStrictDate(s: string): string | undefined {
    if (ISO_DATE_RE.test(s)) {
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    }

    const dmy = EU_DOT_RE.exec(s);
    if (!dmy) {
        return undefined;
    }

    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    // use UTC to avoid local-timezone day-shift
    const ts = Date.UTC(year, month - 1, day);
    const date = new Date(ts);

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return undefined;
    }

    return date.toISOString();
}

type ValueClass = 'bool' | 'number' | 'date' | 'string' | 'empty';

function classifyValue(value: unknown): ValueClass {
    if (value === null || value === undefined || value === '') {
        return 'empty';
    }

    if (typeof value === 'boolean') {
        return 'bool';
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? 'number' : 'string';
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? 'string' : 'date';
    }

    if (typeof value === 'string') {
        const lowered = value.toLowerCase().trim();

        if (BOOL_STRINGS.has(lowered)) {
            return 'bool';
        }

        const trimmed = value.trim();
        if (trimmed !== '' && !Number.isNaN(Number(trimmed)) && Number.isFinite(Number(trimmed))) {
            return 'number';
        }

        if (isStrictDate(trimmed)) {
            return 'date';
        }

        return 'string';
    }

    return 'string';
}

function inferColumnType(values: unknown[]): ColumnDataType {
    let hasBool = false;
    let hasNumber = false;
    let hasDate = false;
    let hasString = false;

    for (const value of values) {
        const cls = classifyValue(value);
        if (cls === 'empty') continue;
        if (cls === 'bool') { hasBool = true; continue; }
        if (cls === 'number') { hasNumber = true; continue; }
        if (cls === 'date') { hasDate = true; continue; }
        hasString = true;
    }

    // any string-typed value forces the whole column to string
    if (hasString) return 'string';
    // mixed types fall back to string
    const typeCount = (hasBool ? 1 : 0) + (hasNumber ? 1 : 0) + (hasDate ? 1 : 0);
    if (typeCount > 1) return 'string';
    if (hasBool) return 'bool';
    if (hasDate) return 'date';
    if (hasNumber) return 'number';

    // all values were empty/null
    return 'string';
}

/**
 * infers column data types from a sample of rows
 *
 * @param rows
 * @returns
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
