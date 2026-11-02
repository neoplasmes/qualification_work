import type {
    MetricExpressionNode,
    MetricExpressionTool,
} from '@qualification-work/microservice-utils/metricExpression';

import type { MetricColumnMeta } from '@/core/ports/driven/repos';

// aggregates whose column must be numeric
const numericAggregates = new Set(['sum', 'avg', 'min', 'max']);

/**
 * read-time term validity: a referenced column must exist and be numeric for arithmetic
 * analyzability is enforced only on write, saved metrics keep evaluating
 *
 * @param tool
 * @param ast
 * @param columns
 * @returns
 */
export function termsAreValid(
    tool: MetricExpressionTool,
    ast: MetricExpressionNode,
    columns: Map<string, MetricColumnMeta>
): boolean {
    return tool.collectTerms(ast).every(term => {
        if (term.column === null) {
            return true;
        }

        const meta = columns.get(term.column);

        return (
            meta !== undefined &&
            (!numericAggregates.has(term.aggregate) || meta.dataType === 'number')
        );
    });
}
