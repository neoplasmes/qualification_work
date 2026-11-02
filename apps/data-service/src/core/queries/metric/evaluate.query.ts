import type { OrgMembership } from '@qualification-work/microservice-utils/auth';
import type {
    MetricAggTerm,
    MetricExpressionNode,
    MetricExpressionTool,
    MetricTermKey,
} from '@qualification-work/microservice-utils/metricExpression';
import type {
    EvaluateMetricsResponse,
    MetricEvaluationItem,
    MetricEvaluationResult,
    MetricTimeBucket,
} from '@qualification-work/types';

import type { MetricRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { termsAreValid } from './lib';

// fallback bucket when trend is enabled without an explicit one
const defaultTimeBucket: MetricTimeBucket = 'month';
// cap of trend points rendered as a sparkline
const maxTrendPoints = 30;

type ParsedMetric = {
    item: MetricEvaluationItem;
    ast: MetricExpressionNode;
};

export type EvaluateMetricsInput = {
    items: MetricEvaluationItem[];
    orgs: OrgMembership[];
};

/**
 * computes metric card values in batch: one scalar scan per dataset
 * plus one grouped scan per trend-enabled metric
 * items of unreadable or missing datasets resolve to null, a dashboard must still render
 */
export class EvaluateMetricsQuery
    implements Executable<[EvaluateMetricsInput], Promise<EvaluateMetricsResponse>>
{
    constructor(
        private readonly metricRepo: MetricRepo,
        private readonly expressionTool: MetricExpressionTool
    ) {}

    async execute(input: EvaluateMetricsInput): Promise<EvaluateMetricsResponse> {
        const results: Record<string, MetricEvaluationResult> = {};
        const readableOrgIds = new Set(input.orgs.map(org => org.id));

        const datasets = await this.metricRepo.findDatasets([
            ...new Set(input.items.map(item => item.datasetId)),
        ]);

        const byDataset = new Map<string, ParsedMetric[]>();
        for (const item of input.items) {
            results[item.id] = { value: null, trend: null };

            const dataset = datasets.get(item.datasetId);
            if (!dataset || !readableOrgIds.has(dataset.orgId)) {
                continue;
            }

            let ast: MetricExpressionNode;
            try {
                ast = this.expressionTool.parse(item.expression);
            } catch {
                continue;
            }

            if (!termsAreValid(this.expressionTool, ast, dataset.columns)) {
                continue;
            }

            const group = byDataset.get(item.datasetId);
            if (group) {
                group.push({ item, ast });
            } else {
                byDataset.set(item.datasetId, [{ item, ast }]);
            }
        }

        await Promise.all(
            [...byDataset].map(async ([datasetId, metrics]) => {
                const termsByKey = new Map<MetricTermKey, MetricAggTerm>();
                for (const metric of metrics) {
                    for (const term of this.expressionTool.collectTerms(metric.ast)) {
                        termsByKey.set(this.expressionTool.termKey(term), term);
                    }
                }

                const values = await this.metricRepo.computeScalars(datasetId, [
                    ...termsByKey.values(),
                ]);
                for (const metric of metrics) {
                    results[metric.item.id].value = this.expressionTool.evaluate(
                        metric.ast,
                        values
                    );
                }

                const dataset = datasets.get(datasetId)!;

                await Promise.all(
                    metrics
                        .filter(metric => metric.item.showTrend)
                        .map(async metric => {
                            // an explicit time column must be a date, otherwise the first date column is used
                            const timeColumn = metric.item.timeColumn
                                ? dataset.columns.get(metric.item.timeColumn)
                                      ?.dataType === 'date'
                                    ? metric.item.timeColumn
                                    : null
                                : dataset.firstDateColumn;
                            if (!timeColumn) {
                                return;
                            }

                            const buckets = await this.metricRepo.computeTrend(
                                datasetId,
                                timeColumn,
                                metric.item.timeBucket ?? defaultTimeBucket,
                                this.expressionTool.collectTerms(metric.ast)
                            );

                            results[metric.item.id].trend =
                                buckets?.slice(-maxTrendPoints).map(bucket => ({
                                    bucket: bucket.bucket,
                                    value: this.expressionTool.evaluate(
                                        metric.ast,
                                        bucket.values
                                    ),
                                })) ?? null;
                        })
                );
            })
        );

        return { results };
    }
}

export type EvaluateMetricsQueryIO = ExecutableIO<EvaluateMetricsQuery>;
