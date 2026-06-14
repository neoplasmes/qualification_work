import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo } from 'react';

import { usePreviewDashboardMetricQuery } from '@/features/manageDashboards';

import { formatMetricValue, type DashboardMetricItem } from '@/entities/dashboard';

import { getApiErrorMessage } from '@/shared/api';

type UseMetricPreviewParams = {
    datasetId: string;
    expression: string;
    format: DashboardMetricItem['format'];
    valueMultiplier: string;
};

const parseMetricPreviewMultiplier = (value: string) => {
    const trimmedValue = value.trim();

    return trimmedValue === '' ? 1 : Number(trimmedValue);
};

export const useMetricPreview = ({
    datasetId,
    expression,
    format,
    valueMultiplier,
}: UseMetricPreviewParams) => {
    const previewExpression = expression.trim();
    const previewEnabled = Boolean(datasetId && previewExpression);
    const previewPayload = useMemo(
        () => (previewEnabled ? { datasetId, expression: previewExpression } : skipToken),
        [datasetId, previewEnabled, previewExpression]
    );
    const metricPreview = usePreviewDashboardMetricQuery(previewPayload);

    if (!previewEnabled) {
        return { content: 'No preview', isMuted: true };
    }

    if (metricPreview.isFetching) {
        return { content: 'Calculating...', isMuted: true };
    }

    if (metricPreview.error) {
        return {
            content: getApiErrorMessage(metricPreview.error, 'Preview unavailable.'),
            isMuted: true,
        };
    }

    return {
        content: formatMetricValue(
            metricPreview.data?.value,
            format,
            parseMetricPreviewMultiplier(valueMultiplier)
        ),
        isMuted: false,
    };
};
