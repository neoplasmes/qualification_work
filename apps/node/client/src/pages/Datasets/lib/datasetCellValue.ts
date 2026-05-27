import { formatChartCell } from '@/entities/chart';
import type { DatasetColumn } from '@/entities/dataset';

import { isDayOfWeekValue } from '@/shared/lib/dayOfWeek';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_PREFIX_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const DATETIME_NO_TZ_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
// dd.mm.yyyy (also dd/mm/yyyy and dd-mm-yyyy) - the format the grid actually shows
const RU_DATE_RE = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;

const isValidDateParts = (year: number, month: number, day: number): boolean => {
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return false;
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

const formatDateParts = (year: string, month: string, day: string): string =>
    `${day}.${month}.${year}`;

const parseRuDate = (text: string): string | null => {
    const match = RU_DATE_RE.exec(text);
    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (!isValidDateParts(year, month, day)) {
        return null;
    }

    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const formatDatasetDate = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '';
    }

    if (value instanceof Date) {
        return formatDateParts(
            String(value.getUTCFullYear()).padStart(4, '0'),
            String(value.getUTCMonth() + 1).padStart(2, '0'),
            String(value.getUTCDate()).padStart(2, '0')
        );
    }

    if (typeof value !== 'string') {
        return formatChartCell(value);
    }

    const text = value.trim();
    if (!text) {
        return '';
    }

    const ruIso = parseRuDate(text);
    if (ruIso) {
        const [year, month, day] = ruIso.split('-');

        return formatDateParts(year, month, day);
    }

    const isoMatch = DATE_PREFIX_RE.exec(text);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        if (isValidDateParts(Number(year), Number(month), Number(day))) {
            return formatDateParts(year, month, day);
        }
    }

    return text;
};

export const isValidDatasetCellValue = (
    value: string,
    dataType: DatasetColumn['dataType']
): boolean => {
    if (value === '') {
        return false;
    }

    if (dataType === 'number') {
        return !Number.isNaN(Number(value)) && Number.isFinite(Number(value));
    }

    if (dataType === 'bool') {
        return value === 'true' || value === 'false';
    }

    if (dataType === 'date') {
        const valueText = value.trim();

        if (DATE_ONLY_RE.test(valueText)) {
            const [year, month, day] = valueText.split('-').map(Number);

            return isValidDateParts(year, month, day);
        }

        if (parseRuDate(valueText)) {
            return true;
        }

        const normalized = DATETIME_NO_TZ_RE.test(valueText)
            ? `${valueText}Z`
            : valueText;

        return !Number.isNaN(new Date(normalized).getTime());
    }

    if (dataType === 'day_of_week') {
        return isDayOfWeekValue(value);
    }

    return true;
};

export const parseDatasetCellValue = (
    value: string,
    dataType: DatasetColumn['dataType']
): unknown => {
    if (dataType === 'number') {
        return Number(value);
    }

    if (dataType === 'bool') {
        return value === 'true';
    }

    if (dataType === 'date') {
        return parseDateValue(value);
    }

    if (dataType === 'day_of_week') {
        return value.trim();
    }

    return value;
};

export const formatDatasetCellValue = (
    value: unknown,
    dataType: DatasetColumn['dataType']
): string => {
    if (dataType === 'date') {
        return formatDatasetDate(value);
    }

    return formatChartCell(value);
};

const parseDateValue = (value: string) => {
    const valueText = value.trim();

    if (DATE_ONLY_RE.test(valueText)) {
        return `${valueText}T00:00:00.000Z`;
    }

    const ruIso = parseRuDate(valueText);
    if (ruIso) {
        return `${ruIso}T00:00:00.000Z`;
    }

    if (DATETIME_NO_TZ_RE.test(valueText)) {
        return new Date(`${valueText}Z`).toISOString();
    }

    return new Date(valueText).toISOString();
};
