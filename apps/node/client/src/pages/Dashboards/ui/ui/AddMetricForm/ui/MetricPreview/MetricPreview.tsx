import type { DashboardMetricItem } from '@/entities/dashboard';

import { getApiErrorMessage } from '@/shared/api';

import { formatMetricValue } from '../../../DashboardWidgets/lib';

import styles from './MetricPreview.module.scss';

type MetricPreviewProps = {
    dataTestId: string;
    enabled: boolean;
    error?: unknown;
    format: DashboardMetricItem['format'];
    isFetching: boolean;
    valueMultiplier: string;
    value: number | null | undefined;
};

export const MetricPreview = ({
    dataTestId,
    enabled,
    error,
    format,
    isFetching,
    valueMultiplier,
    value,
}: MetricPreviewProps) => {
    let content = 'No preview';
    let valueClassName = styles['preview-muted'];

    if (enabled && isFetching) {
        content = 'Calculating...';
    } else if (enabled && error) {
        content = getApiErrorMessage(error, 'Preview unavailable.');
    } else if (enabled) {
        const multiplier =
            valueMultiplier.trim() === '' ? 1 : Number(valueMultiplier.trim());

        content = formatMetricValue(value, format, multiplier);
        valueClassName = styles['preview-value'];
    }

    return (
        <div
            className={styles['preview']}
            data-stack="h"
            data-align="center"
            data-test-id={dataTestId}
        >
            <span className={valueClassName} title={content}>
                {content}
            </span>
        </div>
    );
};
