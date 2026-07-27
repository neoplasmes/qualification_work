import type { DashboardMetricItem } from '@/core/entities/dashboardItem';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { getApiErrorMessage } from '@/ui/errors/apiError';
import { useActiveOrganization, useSession } from '@/ui/session';

import { formatMetricValue } from '../../DashboardWidgets/ui/MetricWidget/lib';

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
    const { activeOrg } = useActiveOrganization(useSession().data);
    const metricPreview = useRead(
        useDependencies().previewDashboardMetric,
        { orgId: activeOrg?.id ?? '', datasetId, expression: previewExpression },
        { enabled: Boolean(activeOrg && previewEnabled) }
    );

    if (!previewEnabled) {
        return { content: 'Нет предпросмотра', isMuted: true };
    }

    if (metricPreview.isFetching) {
        return { content: 'Вычисление...', isMuted: true };
    }

    if (metricPreview.error) {
        return {
            content: getApiErrorMessage(metricPreview.error, 'Предпросмотр недоступен.'),
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
