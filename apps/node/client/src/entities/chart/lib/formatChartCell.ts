// matches ISO datetime with timezone: 2024-01-15T10:00:00.000Z or 2024-01-15T10:00:00+03:00
const ISO_TZ_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;

const formatIsoDate = (value: string): string => {
    const noTz = value.replace(/Z$|[+-]\d{2}:?\d{2}$/, '');
    // midnight UTC - show just the date
    if (/T00:00:00(\.0+)?$/.test(noTz)) {
        return noTz.slice(0, 10);
    }
    return noTz;
};

export const formatChartCell = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'number') {
        return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    if (typeof value === 'string' && ISO_TZ_RE.test(value)) {
        return formatIsoDate(value);
    }

    return String(value);
};

// compact format for Y axis ticks: 1500000 -> "1.5M", 75000 -> "75K"
export const formatAxisNumber = (value: number): string => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) {
        const n = value / 1_000_000;
        return (Number.isInteger(n) ? n.toString() : n.toFixed(1)) + 'M';
    }
    if (abs >= 1_000) {
        const n = value / 1_000;
        return (Number.isInteger(n) ? n.toString() : n.toFixed(1)) + 'K';
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
};
