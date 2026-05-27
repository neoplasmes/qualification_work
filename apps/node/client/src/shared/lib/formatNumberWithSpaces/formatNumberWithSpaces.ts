const INTEGER_GROUP_RE = /\B(?=(\d{3})+(?!\d))/g;

export const formatNumberWithSpaces = (value: number | string): string => {
    const normalized =
        typeof value === 'number'
            ? value.toLocaleString('en-US', {
                  useGrouping: false,
                  maximumFractionDigits: 20,
              })
            : String(value).trim();
    if (!normalized) {
        return '';
    }

    const sign =
        normalized.startsWith('-') || normalized.startsWith('+') ? normalized[0] : '';
    const unsigned = sign ? normalized.slice(1) : normalized;
    const decimalSeparator = unsigned.includes(',') ? ',' : '.';
    const [integerPart, ...fractionParts] = unsigned.split(decimalSeparator);
    const fraction =
        fractionParts.length > 0
            ? `${decimalSeparator}${fractionParts.join(decimalSeparator)}`
            : '';

    return `${sign}${integerPart.replace(INTEGER_GROUP_RE, ' ')}${fraction}`;
};
