import type {
    DashboardRepo,
    MetricPreview,
    PreviewMetricInput,
} from '@/app/ports/repos/dashboard';

import type { Query } from '../query';

export function createPreviewDashboardMetric(
    repo: DashboardRepo
): Query<PreviewMetricInput, MetricPreview> {
    return {
        name: 'previewDashboardMetric',
        execute: (input, options) => repo.previewDashboardMetric(input, options),
        reads: () => ['metricPreview'],
    };
}
