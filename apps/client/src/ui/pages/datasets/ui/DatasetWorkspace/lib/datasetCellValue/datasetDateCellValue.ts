import { formatChartCell } from '@/ui/widgets/ChartShell';

const dateOnlyRe = /^\d{4}-\d{2}-\d{2}$/;
const datePrefixRe = /^(\d{4})-(\d{2})-(\d{2})/;
const datetimeNoTimezoneRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
const ruDateRe = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;

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

const parseRuDate = (text: string): string | null => {
    const match = ruDateRe.exec(text);
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

export const isValidDatasetDateCellValue = (value: string): boolean => {
    const valueText = value.trim();

    if (dateOnlyRe.test(valueText)) {
        const [year, month, day] = valueText.split('-').map(Number);

        return isValidDateParts(year, month, day);
    }

    if (parseRuDate(valueText)) {
        return true;
    }

    const normalized = datetimeNoTimezoneRe.test(valueText) ? `${valueText}Z` : valueText;

    return !Number.isNaN(new Date(normalized).getTime());
};

export const parseDatasetDateCellValue = (value: string): string => {
    const valueText = value.trim();

    if (dateOnlyRe.test(valueText)) {
        return `${valueText}T00:00:00.000Z`;
    }

    const ruIso = parseRuDate(valueText);
    if (ruIso) {
        return `${ruIso}T00:00:00.000Z`;
    }

    if (datetimeNoTimezoneRe.test(valueText)) {
        return new Date(`${valueText}Z`).toISOString();
    }

    return new Date(valueText).toISOString();
};

export const formatDatasetDateCellValue = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '';
    }

    if (value instanceof Date) {
        const year = String(value.getUTCFullYear()).padStart(4, '0');
        const month = String(value.getUTCMonth() + 1).padStart(2, '0');
        const day = String(value.getUTCDate()).padStart(2, '0');

        return `${day}.${month}.${year}`;
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

        return `${day}.${month}.${year}`;
    }

    const isoMatch = datePrefixRe.exec(text);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        if (isValidDateParts(Number(year), Number(month), Number(day))) {
            return `${day}.${month}.${year}`;
        }
    }

    return text;
};
