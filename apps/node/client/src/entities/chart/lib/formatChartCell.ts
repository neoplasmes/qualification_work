export const formatChartCell = (value: unknown) => {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'number') {
        return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
};
