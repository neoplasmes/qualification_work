import type { OrgMembership } from '@qualification-work/microservice-utils/auth';
import {
    NotFoundError,
    ValidationError,
} from '@qualification-work/microservice-utils/errors';
import type { MetricExpressionTool } from '@qualification-work/microservice-utils/metricExpression';
import type {
    PreviewDashboardMetricPayload,
    PreviewDashboardMetricResponse,
} from '@qualification-work/types';

import type { MetricRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { termsAreValid } from './lib';

export type PreviewMetricInput = PreviewDashboardMetricPayload & {
    orgs: OrgMembership[];
};

/**
 * previews a metric expression against a readable dataset without saving it
 */
export class PreviewMetricQuery
    implements Executable<[PreviewMetricInput], Promise<PreviewDashboardMetricResponse>>
{
    constructor(
        private readonly metricRepo: MetricRepo,
        private readonly expressionTool: MetricExpressionTool
    ) {}

    async execute(input: PreviewMetricInput): Promise<PreviewDashboardMetricResponse> {
        const dataset = (await this.metricRepo.findDatasets([input.datasetId])).get(
            input.datasetId
        );
        if (!dataset || !input.orgs.some(org => org.id === dataset.orgId)) {
            throw new NotFoundError(`Dataset ${input.datasetId} not found`);
        }

        const ast = this.expressionTool.parse(input.expression);
        const terms = this.expressionTool.collectTerms(ast);

        for (const term of terms) {
            if (
                term.column !== null &&
                dataset.columns.get(term.column)?.isAnalyzable === false
            ) {
                throw new ValidationError(
                    [term.column],
                    `Column "${term.column}" is not included in analysis`
                );
            }
        }

        if (!termsAreValid(this.expressionTool, ast, dataset.columns)) {
            return { value: null };
        }

        const values = await this.metricRepo.computeScalars(input.datasetId, terms);

        return { value: this.expressionTool.evaluate(ast, values) };
    }
}

export type PreviewMetricQueryIO = ExecutableIO<PreviewMetricQuery>;
