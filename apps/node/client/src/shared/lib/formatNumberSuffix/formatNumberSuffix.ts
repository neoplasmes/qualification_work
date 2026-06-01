const legacySuffixByFormat: Record<string, string> = {
    number: '',
    rub: '₽',
    percent: '%',
    currency: '₽',
};

export const normalizeNumberSuffix = (format: string | undefined): string => {
    const value = format?.trim() ?? '';

    return legacySuffixByFormat[value] ?? value;
};

export const decorateFormattedNumber = (
    value: string,
    format: string | undefined
): string => {
    const rawFormat = format?.trim() ?? '';
    const suffix = normalizeNumberSuffix(rawFormat);

    if (!suffix) {
        return value;
    }

    if (rawFormat === 'usd') {
        return value.startsWith('-') ? `-$${value.slice(1)}` : `$${value}`;
    }

    if (suffix === '%') {
        return `${value}%`;
    }

    return `${value} ${suffix}`;
};
