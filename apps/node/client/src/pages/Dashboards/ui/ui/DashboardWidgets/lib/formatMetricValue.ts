import type { DashboardMetricItem } from '@/entities/dashboard';

import { decorateFormattedNumber } from '@/shared/lib/formatNumberSuffix';

const metricNumberFormatter = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
});

export const formatMetricValue = (
    value: DashboardMetricItem['value'],
    format: DashboardMetricItem['format'],
    valueMultiplier?: number
) => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return 'No value';
    }

    const defaultMultiplier = format === 'percent' ? 100 : 1;
    const multiplier =
        typeof valueMultiplier === 'number' && Number.isFinite(valueMultiplier)
            ? valueMultiplier
            : defaultMultiplier;
    const formatted = metricNumberFormatter.format(value * multiplier);

    return decorateFormattedNumber(formatted, format);
};
