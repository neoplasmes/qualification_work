import { Router } from 'primitive-server';

import type { EvaluateMetricsQuery, PreviewMetricQuery } from '@/core/queries';

import type { AppState } from '@/shared/appState';

import { createEvaluateMetricsHandler, createPreviewMetricHandler } from './post';

export function createMetricsRouter(
    evaluateMetricsHandler: EvaluateMetricsQuery,
    previewMetricHandler: PreviewMetricQuery
): Router<AppState> {
    const router = new Router<AppState>('/metrics');

    router.post('/evaluate', createEvaluateMetricsHandler(evaluateMetricsHandler));
    router.post('/preview', createPreviewMetricHandler(previewMetricHandler));

    return router;
}
