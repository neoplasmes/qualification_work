import type { DatasetColumn } from '@/entities/dataset';

import { isDayOfWeekValue } from '@/shared/lib/dayOfWeek';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_NO_TZ_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
// dd.mm.yyyy (also dd/mm/yyyy and dd-mm-yyyy) - the format the grid actually shows
const RU_DATE_RE = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;

const parseRuDate = (text: string): string | null => {
    const match = RU_DATE_RE.exec(text);
    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    // reject calendar-invalid dates like 31.02.2025 that Date silently rolls over
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
            return !Number.isNaN(new Date(`${valueText}T00:00:00.000Z`).getTime());
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
