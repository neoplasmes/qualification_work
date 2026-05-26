import type { DatasetColumn } from '@/entities/dataset';

import { isDayOfWeekValue } from '@/shared/lib/dayOfWeek';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_NO_TZ_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

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

    if (DATETIME_NO_TZ_RE.test(valueText)) {
        return new Date(`${valueText}Z`).toISOString();
    }

    return new Date(valueText).toISOString();
};
