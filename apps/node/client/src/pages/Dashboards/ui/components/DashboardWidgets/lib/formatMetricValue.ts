import type { DashboardMetricItem } from '@/entities/dashboard';

export const formatMetricValue = (
    value: DashboardMetricItem['value'],
    format: DashboardMetricItem['format']
) => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return 'No value';
    }

    if (format === 'currency') {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0,
        }).format(value);
    }

    if (format === 'percent') {
        return new Intl.NumberFormat('ru-RU', {
            style: 'percent',
            maximumFractionDigits: 2,
        }).format(value);
    }

    return new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 2,
    }).format(value);
};
