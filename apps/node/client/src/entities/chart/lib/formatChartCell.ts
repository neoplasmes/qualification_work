import { formatNumberWithSpaces } from '@/shared/lib/formatNumberWithSpaces';

import type { MeasureValueFormat, TimeGranularity } from '../api';

// matches ISO datetime with timezone: 2024-01-15T10:00:00.000Z or 2024-01-15T10:00:00+03:00
const ISO_TZ_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;
const DATE_PARTS_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/;

const formatIsoDate = (value: string): string => {
    const noTz = value.replace(/Z$|[+-]\d{2}:?\d{2}$/, '');
    // midnight UTC - show just the date
    if (/T00:00:00(\.0+)?$/.test(noTz)) {
        return noTz.slice(0, 10);
    }

    return noTz;
};

type FormatChartCellOptions = {
    timeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
};

const formatPlainNumber = (value: number, fractionDigits = 2): string =>
    formatNumberWithSpaces(
        Number.isInteger(value) ? String(value) : value.toFixed(fractionDigits)
    );

const decorateNumber = (value: string, format: MeasureValueFormat = 'number') => {
    if (format === 'rub') {
        return `${value} ₽`;
    }
    if (format === 'usd') {
        return value.startsWith('-') ? `-$${value.slice(1)}` : `$${value}`;
    }
    if (format === 'percent') {
        return `${value}%`;
    }

    return value;
};

const getDateParts = (value: string) => {
    const match = value.match(DATE_PARTS_RE);
    if (!match) {
        return null;
    }

    return {
        year: match[1],
        month: match[2],
        day: match[3],
        hour: match[4],
        minute: match[5],
    };
};

const formatDateByGranularity = (value: string, granularity: TimeGranularity): string => {
    const parts = getDateParts(value);
    if (!parts) {
        return formatIsoDate(value);
    }

    const day = `${parts.day}.${parts.month}.${parts.year}`;
    if (granularity === 'month') {
        return `${parts.month}.${parts.year}`;
    }
    if (granularity === 'year') {
        return parts.year;
    }
    if (granularity === 'quarter') {
        const quarter = Math.floor((Number(parts.month) - 1) / 3) + 1;

        return `Q${quarter} ${parts.year}`;
    }
    if (granularity === 'hour') {
        return `${day} ${parts.hour ?? '00'}:${parts.minute ?? '00'}`;
    }

    return day;
};

export const formatChartCell = (
    value: unknown,
    options: FormatChartCellOptions = {}
): string => {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'number') {
        return decorateNumber(formatPlainNumber(value), options.valueFormat);
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    if (
        typeof value === 'string' &&
        options.timeGranularity &&
        DATE_PARTS_RE.test(value)
    ) {
        return formatDateByGranularity(value, options.timeGranularity);
    }

    if (typeof value === 'string' && ISO_TZ_RE.test(value)) {
        if (options.timeGranularity) {
            return formatDateByGranularity(value, options.timeGranularity);
        }

        return formatIsoDate(value);
    }

    return String(value);
};

// compact format for Y axis ticks: 1500000 -> "1.5M", 75000 -> "75K"
export const formatAxisNumber = (
    value: number,
    valueFormat: MeasureValueFormat = 'number'
): string => {
    const abs = Math.abs(value);
    let formatted: string;

    if (abs >= 1_000_000) {
        const n = value / 1_000_000;

        formatted = (Number.isInteger(n) ? n.toString() : n.toFixed(1)) + 'M';
    } else if (abs >= 1_000) {
        const n = value / 1_000;

        formatted = (Number.isInteger(n) ? n.toString() : n.toFixed(1)) + 'K';
    } else {
        formatted = formatPlainNumber(value, 1);
    }

    return decorateNumber(formatted, valueFormat);
};
